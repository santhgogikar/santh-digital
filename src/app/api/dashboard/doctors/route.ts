import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireClinicSession } from "@/lib/auth";
import { getClinicById } from "@/lib/clinic";
import { hasura } from "@/lib/hasura";
import { slugify } from "@/lib/slug";

const schema = z.object({
  name: z.string().min(3).max(80),
  qualification: z.string().max(120).optional(),
  specialisation: z.string().max(120).optional(),
  experienceYears: z.number().int().min(0).max(60).optional(),
  bio: z.string().max(800).optional(),
  serviceIds: z.array(z.string()).optional(),
});

const DEFAULT_SESSIONS = [
  { start: "10:00:00", end: "14:00:00" },
  { start: "17:00:00", end: "20:00:00" },
];

export async function POST(request: NextRequest) {
  const session = await requireClinicSession();
  if (!session.clinicId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid doctor." }, { status: 400 });
  }

  const clinic = await getClinicById(session.clinicId);
  if (!clinic) return NextResponse.json({ error: "Clinic not found." }, { status: 404 });
  const location = clinic.locations[0];
  const slug = slugify(parsed.data.name.replace(/^dr\.?\s+/i, ""));

  const doctor = await hasura<{ insert_doctors_one: { id: string } }>(
    `mutation AddDoctor(
      $clinicId: uuid!
      $locationId: uuid
      $name: String!
      $slug: String!
      $qualification: String
      $specialisation: String
      $experience: Int
      $bio: String
    ) {
      insert_doctors_one(
        object: {
          clinic_id: $clinicId
          location_id: $locationId
          name: $name
          slug: $slug
          qualification: $qualification
          specialisation: $specialisation
          experience_years: $experience
          bio: $bio
          is_active: true
        }
      ) { id }
    }`,
    {
      clinicId: session.clinicId,
      locationId: location?.id ?? null,
      name: parsed.data.name.trim(),
      slug: `${slug}-${String(Date.now()).slice(-4)}`,
      qualification: parsed.data.qualification || null,
      specialisation: parsed.data.specialisation || null,
      experience: parsed.data.experienceYears || null,
      bio: parsed.data.bio || null,
    },
  );

  const serviceIds = (parsed.data.serviceIds ?? []).filter((id) => clinic.services.some((s) => s.id === id));
  if (serviceIds.length) {
    await hasura(
      `mutation Link($objects: [doctor_services_insert_input!]!) {
        insert_doctor_services(objects: $objects) { affected_rows }
      }`,
      { objects: serviceIds.map((service_id) => ({ doctor_id: doctor.insert_doctors_one.id, service_id })) },
    );
  }

  const hours: {
    clinic_id: string;
    doctor_id: string;
    location_id: string | null;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }[] = [];
  for (let day = 1; day <= 6; day += 1) {
    for (const sessionHours of DEFAULT_SESSIONS) {
      hours.push({
        clinic_id: session.clinicId,
        doctor_id: doctor.insert_doctors_one.id,
        location_id: location?.id ?? null,
        day_of_week: day,
        start_time: sessionHours.start,
        end_time: sessionHours.end,
      });
    }
  }
  await hasura(
    `mutation Hours($objects: [working_hours_insert_input!]!) {
      insert_working_hours(objects: $objects) { affected_rows }
    }`,
    { objects: hours },
  );

  revalidatePath("/dashboard/doctors");
  revalidatePath("/c/smile-care-mehdipatnam");
  return NextResponse.json({ ok: true, id: doctor.insert_doctors_one.id });
}
