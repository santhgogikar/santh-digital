import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireClinicSession } from "@/lib/auth";
import { hasura } from "@/lib/hasura";

export async function GET() {
  const session = await requireClinicSession();
  if (!session.clinicId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const data = await hasura<{
    appointments: {
      id: string;
      booking_reference: string;
      status: string;
      starts_at: string;
      ends_at: string;
      notes: string | null;
      doctor: { name: string };
      service: { name: string };
      patient: { name: string; mobile: string };
      location: { name: string };
    }[];
  }>(
    `query Appointments($clinicId: uuid!) {
      appointments(
        where: { clinic_id: { _eq: $clinicId } }
        order_by: { starts_at: desc }
        limit: 80
      ) {
        id
        booking_reference
        status
        starts_at
        ends_at
        notes
        doctor { name }
        service { name }
        patient { name mobile }
        location { name }
      }
    }`,
    { clinicId: session.clinicId },
  );

  return NextResponse.json(data.appointments);
}

export async function PATCH(request: NextRequest) {
  const session = await requireClinicSession();
  if (!session.clinicId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const body = (await request.json()) as { id?: string; status?: string };
  const allowed = ["pending", "confirmed", "completed", "cancelled", "no_show"];
  if (!body.id || !body.status || !allowed.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status update." }, { status: 400 });
  }
  await hasura(
    `mutation SetStatus($id: uuid!, $clinicId: uuid!, $status: appointment_status!) {
      update_appointments(
        where: { id: { _eq: $id }, clinic_id: { _eq: $clinicId } }
        _set: { status: $status }
      ) { affected_rows }
    }`,
    { id: body.id, clinicId: session.clinicId, status: body.status },
  );
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/appointments");
  return NextResponse.json({ ok: true });
}
