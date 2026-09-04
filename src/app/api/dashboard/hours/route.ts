import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireClinicSession } from "@/lib/auth";
import { getClinicById } from "@/lib/clinic";
import { hasura } from "@/lib/hasura";

const schema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function POST(request: NextRequest) {
  const session = await requireClinicSession();
  if (!session.clinicId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid hours." }, { status: 400 });
  }
  if (parsed.data.endTime <= parsed.data.startTime) {
    return NextResponse.json({ error: "End time must be after start time." }, { status: 400 });
  }

  const clinic = await getClinicById(session.clinicId);
  const locationId = clinic?.locations[0]?.id ?? null;

  await hasura(
    `mutation AddHours(
      $clinicId: uuid!
      $locationId: uuid
      $day: Int!
      $start: time!
      $end: time!
    ) {
      insert_working_hours_one(
        object: {
          clinic_id: $clinicId
          doctor_id: null
          location_id: $locationId
          day_of_week: $day
          start_time: $start
          end_time: $end
        }
      ) { id }
    }`,
    {
      clinicId: session.clinicId,
      locationId,
      day: parsed.data.dayOfWeek,
      start: `${parsed.data.startTime}:00`,
      end: `${parsed.data.endTime}:00`,
    },
  );

  revalidatePath("/dashboard/hours");
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const session = await requireClinicSession();
  if (!session.clinicId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const body = (await request.json()) as { id?: string };
  if (!body.id) return NextResponse.json({ error: "id required." }, { status: 400 });

  await hasura(
    `mutation DropHours($id: uuid!, $clinicId: uuid!) {
      delete_working_hours(where: { id: { _eq: $id }, clinic_id: { _eq: $clinicId }, doctor_id: { _is_null: true } }) {
        affected_rows
      }
    }`,
    { id: body.id, clinicId: session.clinicId },
  );

  revalidatePath("/dashboard/hours");
  return NextResponse.json({ ok: true });
}
