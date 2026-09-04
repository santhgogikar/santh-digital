import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireClinicSession } from "@/lib/auth";
import { getClinicById } from "@/lib/clinic";
import { hasura } from "@/lib/hasura";
import { slugify } from "@/lib/slug";

const schema = z.object({
  name: z.string().min(3).max(80),
  description: z.string().min(8).max(400),
  doctorIds: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  const session = await requireClinicSession();
  if (!session.clinicId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid service." }, { status: 400 });
  }

  const clinic = await getClinicById(session.clinicId);
  if (!clinic) return NextResponse.json({ error: "Clinic not found." }, { status: 404 });

  const created = await hasura<{ insert_services_one: { id: string } }>(
    `mutation AddService(
      $clinicId: uuid!
      $name: String!
      $slug: String!
      $description: String!
      $duration: Int!
      $order: Int!
    ) {
      insert_services_one(
        object: {
          clinic_id: $clinicId
          name: $name
          slug: $slug
          description: $description
          duration_minutes: $duration
          display_order: $order
          is_active: true
        }
      ) { id }
    }`,
    {
      clinicId: session.clinicId,
      name: parsed.data.name.trim(),
      slug: `${slugify(parsed.data.name)}-${String(Date.now()).slice(-4)}`,
      description: parsed.data.description.trim(),
      duration: clinic.slot_duration_minutes || 30,
      order: clinic.services.length + 1,
    },
  );

  const doctorIds = (parsed.data.doctorIds ?? []).filter((id) => clinic.doctors.some((d) => d.id === id));
  if (doctorIds.length) {
    await hasura(
      `mutation Link($objects: [doctor_services_insert_input!]!) {
        insert_doctor_services(objects: $objects) { affected_rows }
      }`,
      {
        objects: doctorIds.map((doctor_id) => ({
          doctor_id,
          service_id: created.insert_services_one.id,
        })),
      },
    );
  }

  revalidatePath("/dashboard/services");
  revalidatePath("/dashboard/doctors");
  return NextResponse.json({ ok: true, id: created.insert_services_one.id });
}
