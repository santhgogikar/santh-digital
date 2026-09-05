import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSystemAdmin } from "@/lib/auth";
import { hasura } from "@/lib/hasura";
import { slugify } from "@/lib/slug";
import { defaultWorkingHours } from "@/lib/default-hours";
import { handleAuthError } from "@/lib/api-error";

const branchFields = z.object({
  shortAddress: z.string().min(3).max(200),
  clinicNumber: z.string().min(8).max(40),
  fullAddress: z.string().min(8).max(400),
  mapURL: z.string().max(500),
  slug: z.string().min(3).max(80).optional(),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8).max(80),
  adminName: z.string().min(2).max(80).optional(),
});

const createClinicSchema = z.object({
  name: z.string().min(3).max(80),
  description: z.string().max(800).optional(),
  clinicAdminEmail: z.string().email(),
  clinicAdminPassword: z.string().min(8).max(80),
  clinicAdminName: z.string().min(2).max(80).optional(),
  branch: branchFields,
});

async function insertBranch(args: {
  groupId: string;
  clinicName: string;
  branch: z.infer<typeof branchFields>;
}) {
  const slug = slugify(args.branch.slug || `${args.clinicName}-${args.branch.shortAddress}`);
  const passwordHash = await hash(args.branch.adminPassword, 10);
  const created = await hasura<{
    insert_clinics_one: { id: string };
  }>(
    `mutation AddClinic(
      $groupId: uuid!
      $name: String!
      $slug: String!
      $phone: String!
      $shortAddress: String!
      $fullAddress: String!
      $mapUrl: String!
      $description: String
    ) {
      insert_clinics_one(
        object: {
          group_id: $groupId
          name: $name
          slug: $slug
          tagline: $description
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
      groupId: args.groupId,
      name: args.clinicName,
      slug,
      phone: args.branch.clinicNumber,
      shortAddress: args.branch.shortAddress,
      fullAddress: args.branch.fullAddress,
      mapUrl: args.branch.mapURL,
      description: null,
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
      name: args.branch.shortAddress.split(",")[0]?.trim() || "Branch",
      address: args.branch.fullAddress.split("\n")[0] ?? args.branch.fullAddress,
      phone: args.branch.clinicNumber,
      mapUrl: args.branch.mapURL,
    },
  );

  await hasura(
    `mutation Hours($objects: [working_hours_insert_input!]!) {
      insert_working_hours(objects: $objects) { affected_rows }
    }`,
    { objects: defaultWorkingHours(created.insert_clinics_one.id, location.insert_locations_one.id) },
  );

  await hasura(
    `mutation AddBranchAdmin(
      $clinicId: uuid!
      $email: String!
      $hash: String!
      $name: String!
    ) {
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
      email: args.branch.adminEmail.trim().toLowerCase(),
      hash: passwordHash,
      name: args.branch.adminName?.trim() || "Branch Admin",
    },
  );

  return { id: created.insert_clinics_one.id, slug };
}

export async function GET() {
  try {
    await requireSystemAdmin();
    const data = await hasura<{
      clinic_groups: {
        id: string;
        name: string;
        description: string | null;
        clinics: { id: string; slug: string; short_address: string | null; is_active: boolean }[];
      }[];
    }>(
      `query Groups {
        clinic_groups(order_by: { name: asc }) {
          id
          name
          description
          clinics(order_by: { short_address: asc }) {
            id slug short_address is_active
          }
        }
      }`,
    );
    return NextResponse.json(data.clinic_groups);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSystemAdmin();
    const parsed = createClinicSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid clinic." }, { status: 400 });
    }

    const group = await hasura<{ insert_clinic_groups_one: { id: string } }>(
      `mutation AddGroup($name: String!, $description: String) {
        insert_clinic_groups_one(object: { name: $name, description: $description }) { id }
      }`,
      { name: parsed.data.name.trim(), description: parsed.data.description?.trim() || null },
    );

    const clinicAdminHash = await hash(parsed.data.clinicAdminPassword, 10);
    await hasura(
      `mutation AddClinicAdmin($groupId: uuid!, $email: String!, $hash: String!, $name: String!) {
        insert_users_one(
          object: {
            group_id: $groupId
            email: $email
            password_hash: $hash
            name: $name
            role: clinic_admin
          }
        ) { id }
      }`,
      {
        groupId: group.insert_clinic_groups_one.id,
        email: parsed.data.clinicAdminEmail.trim().toLowerCase(),
        hash: clinicAdminHash,
        name: parsed.data.clinicAdminName?.trim() || "Clinic Admin",
      },
    );

    const branch = await insertBranch({
      groupId: group.insert_clinic_groups_one.id,
      clinicName: parsed.data.name.trim(),
      branch: parsed.data.branch,
    });

    return NextResponse.json({
      ok: true,
      groupId: group.insert_clinic_groups_one.id,
      branch,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

const renameSchema = z.object({
  groupId: z.string().uuid(),
  name: z.string().min(3).max(80),
});

export async function PATCH(request: NextRequest) {
  try {
    await requireSystemAdmin();
    const parsed = renameSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid name." }, { status: 400 });
    }
    const name = parsed.data.name.trim();
    await hasura(
      `mutation RenameGroup($id: uuid!, $name: String!) {
        update_clinic_groups_by_pk(pk_columns: { id: $id }, _set: { name: $name }) { id }
        update_clinics(where: { group_id: { _eq: $id } }, _set: { name: $name }) { affected_rows }
      }`,
      { id: parsed.data.groupId, name },
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
