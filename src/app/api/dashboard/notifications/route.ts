import { NextRequest, NextResponse } from "next/server";
import { requireClinicSession } from "@/lib/auth";
import { hasura } from "@/lib/hasura";
import { getDashboardScope } from "@/lib/scope";
import { handleAuthError } from "@/lib/api-error";

export async function GET() {
  try {
    const session = await requireClinicSession();
    const scope = await getDashboardScope(session);
    const data = await hasura<{
      clinic_notifications: {
        id: string;
        title: string;
        body: string;
        created_at: string;
        read_at: string | null;
        appointment_id: string;
      }[];
    }>(
      `query Unread($clinicIds: [uuid!]!) {
        clinic_notifications(
          where: { clinic_id: { _in: $clinicIds }, read_at: { _is_null: true } }
          order_by: { created_at: desc }
          limit: 20
        ) {
          id
          title
          body
          created_at
          read_at
          appointment_id
        }
      }`,
      { clinicIds: scope.clinicIds },
    );
    return NextResponse.json({ notifications: data.clinic_notifications });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireClinicSession();
    const scope = await getDashboardScope(session);
    const body = (await request.json()) as { id?: string; all?: boolean };

    if (body.all) {
      await hasura(
        `mutation ReadAll($clinicIds: [uuid!]!, $now: timestamptz!) {
          update_clinic_notifications(
            where: { clinic_id: { _in: $clinicIds }, read_at: { _is_null: true } }
            _set: { read_at: $now }
          ) { affected_rows }
        }`,
        { clinicIds: scope.clinicIds, now: new Date().toISOString() },
      );
      return NextResponse.json({ ok: true });
    }

    if (!body.id) return NextResponse.json({ error: "id required." }, { status: 400 });
    await hasura(
      `mutation ReadOne($id: uuid!, $clinicIds: [uuid!]!, $now: timestamptz!) {
        update_clinic_notifications(
          where: { id: { _eq: $id }, clinic_id: { _in: $clinicIds } }
          _set: { read_at: $now }
        ) { affected_rows }
      }`,
      { id: body.id, clinicIds: scope.clinicIds, now: new Date().toISOString() },
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
