import { NextRequest, NextResponse } from "next/server";
import { requireClinicSession } from "@/lib/auth";
import { hasura } from "@/lib/hasura";

export async function GET() {
  const session = await requireClinicSession();
  if (!session.clinicId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

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
    `query Unread($clinicId: uuid!) {
      clinic_notifications(
        where: { clinic_id: { _eq: $clinicId }, read_at: { _is_null: true } }
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
    { clinicId: session.clinicId },
  );

  return NextResponse.json({ notifications: data.clinic_notifications });
}

export async function PATCH(request: NextRequest) {
  const session = await requireClinicSession();
  if (!session.clinicId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const body = (await request.json()) as { id?: string; all?: boolean };

  if (body.all) {
    await hasura(
      `mutation ReadAll($clinicId: uuid!, $now: timestamptz!) {
        update_clinic_notifications(
          where: { clinic_id: { _eq: $clinicId }, read_at: { _is_null: true } }
          _set: { read_at: $now }
        ) { affected_rows }
      }`,
      { clinicId: session.clinicId, now: new Date().toISOString() },
    );
    return NextResponse.json({ ok: true });
  }

  if (!body.id) return NextResponse.json({ error: "id required." }, { status: 400 });
  await hasura(
    `mutation ReadOne($id: uuid!, $clinicId: uuid!, $now: timestamptz!) {
      update_clinic_notifications(
        where: { id: { _eq: $id }, clinic_id: { _eq: $clinicId } }
        _set: { read_at: $now }
      ) { affected_rows }
    }`,
    { id: body.id, clinicId: session.clinicId, now: new Date().toISOString() },
  );
  return NextResponse.json({ ok: true });
}
