import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSystemAdmin } from "@/lib/auth";
import { hasura } from "@/lib/hasura";
import { slugify } from "@/lib/slug";
import { defaultWorkingHours } from "@/lib/default-hours";
import { handleAuthError } from "@/lib/api-error";
import { hash } from "bcryptjs";

const schema = z.object({
  groupId: z.string().uuid(),
  shortAddress: z.string().min(3).max(200),
  clinicNumber: z.string().min(8).max(40),
  fullAddress: z.string().min(8).max(400),
  mapURL: z.string().max(500),
  slug: z.string().min(3).max(80).optional(),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8).max(80),
  adminName: z.string().min(2).max(80).optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireSystemAdmin();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid branch." }, { status: 400 });
    }

    const group = await hasura<{ clinic_groups_by_pk: { id: string; name: string } | null }>(
      `query Group($id: uuid!) { clinic_groups_by_pk(id: $id) { id name } }`,
      { id: parsed.data.groupId },
    );
    if (!group.clinic_groups_by_pk) {
      return NextResponse.json({ error: "Clinic not found." }, { status: 404 });
    }

    const slug = slugify(parsed.data.slug || `${group.clinic_groups_by_pk.name}-${parsed.data.shortAddress}`);
    const passwordHash = await hash(parsed.data.adminPassword, 10);

    const created = await hasura<{ insert_clinics_one: { id: string } }>(
      `mutation AddClinic(
        $groupId: uuid!
        $name: String!
        $slug: String!
        $phone: String!
        $shortAddress: String!
        $fullAddress: String!
        $mapUrl: String!
      ) {
        insert_clinics_one(
          object: {
            group_id: $groupId
            name: $name
            slug: $slug
            phone: $phone
            short_address: $shortAddress
            full_address: $fullAddress
            map_url: $mapUrl
            timezone: "Asia/Kolkata"
            booking_mode: request
            is_active: true
          }
        ) { id }
      }`,
      {
        groupId: parsed.data.groupId,
        name: group.clinic_groups_by_pk.name,
        slug,
        phone: parsed.data.clinicNumber,
        shortAddress: parsed.data.shortAddress,
        fullAddress: parsed.data.fullAddress,
        mapUrl: parsed.data.mapURL,
      },
    );

    const location = await hasura<{ insert_locations_one: { id: string } }>(
      `mutation AddLocation(
        $clinicId: uuid!
        $name: String!
        $address: String!
        $phone: String!
        $mapUrl: String!
      ) {
        insert_locations_one(
          object: {
            clinic_id: $clinicId
            name: $name
            address_line1: $address
            area: $name
            city: "Hyderabad"
            state: "Telangana"
            phone: $phone
            google_maps_url: $mapUrl
            is_primary: true
          }
        ) { id }
      }`,
      {
        clinicId: created.insert_clinics_one.id,
        name: parsed.data.shortAddress.split(",")[0]?.trim() || "Branch",
        address: parsed.data.fullAddress.split("\n")[0] ?? parsed.data.fullAddress,
        phone: parsed.data.clinicNumber,
        mapUrl: parsed.data.mapURL,
      },
    );

    await hasura(
      `mutation Hours($objects: [working_hours_insert_input!]!) {
        insert_working_hours(objects: $objects) { affected_rows }
      }`,
      { objects: defaultWorkingHours(created.insert_clinics_one.id, location.insert_locations_one.id) },
    );

    await hasura(
      `mutation AddBranchAdmin($clinicId: uuid!, $email: String!, $hash: String!, $name: String!) {
        insert_users_one(
          object: {
            clinic_id: $clinicId
            email: $email
            password_hash: $hash
            name: $name
            role: clinic_admin
          }
        ) { id }
      }`,
      {
        clinicId: created.insert_clinics_one.id,
        email: parsed.data.adminEmail.trim().toLowerCase(),
        hash: passwordHash,
        name: parsed.data.adminName?.trim() || "Branch Admin",
      },
    );

    return NextResponse.json({ ok: true, id: created.insert_clinics_one.id, slug });
  } catch (error) {
    return handleAuthError(error);
  }
}
