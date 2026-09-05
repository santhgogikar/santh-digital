import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireClinicSession } from "@/lib/auth";
import { hasura } from "@/lib/hasura";
import { getDashboardScope } from "@/lib/scope";
import { handleAuthError } from "@/lib/api-error";

export async function GET() {
  try {
    const session = await requireClinicSession();
    const scope = await getDashboardScope(session);
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
      `query Appointments($clinicIds: [uuid!]!) {
        appointments(
          where: { clinic_id: { _in: $clinicIds } }
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
      { clinicIds: scope.clinicIds },
    );
    return NextResponse.json(data.appointments);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireClinicSession();
    const scope = await getDashboardScope(session);
    const body = (await request.json()) as { id?: string; status?: string };
    const allowed = ["pending", "confirmed", "completed", "cancelled", "no_show"];
    if (!body.id || !body.status || !allowed.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status update." }, { status: 400 });
    }
    await hasura(
      `mutation SetStatus($id: uuid!, $clinicIds: [uuid!]!, $status: appointment_status!) {
        update_appointments(
          where: { id: { _eq: $id }, clinic_id: { _in: $clinicIds } }
          _set: { status: $status }
        ) { affected_rows }
      }`,
      { id: body.id, clinicIds: scope.clinicIds, status: body.status },
    );
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/appointments");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
