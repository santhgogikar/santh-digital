import { NextRequest, NextResponse } from "next/server";
import { requireClinicSession } from "@/lib/auth";
import { hasura } from "@/lib/hasura";

export async function GET() {
  const session = await requireClinicSession();
  if (!session.clinicId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const data = await hasura<{
    leads: {
      id: string;
      name: string;
      mobile: string;
      requirement: string | null;
      status: string;
      created_at: string;
    }[];
  }>(
    `query Leads($clinicId: uuid!) {
      leads(where: { clinic_id: { _eq: $clinicId } }, order_by: { created_at: desc }, limit: 80) {
        id
        name
        mobile
        requirement
        status
        created_at
      }
    }`,
    { clinicId: session.clinicId },
  );
  return NextResponse.json(data.leads);
}

export async function PATCH(request: NextRequest) {
  const session = await requireClinicSession();
  if (!session.clinicId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const body = (await request.json()) as { id?: string; status?: string };
  const allowed = ["new", "contacted", "converted", "lost"];
  if (!body.id || !body.status || !allowed.includes(body.status)) {
    return NextResponse.json({ error: "Invalid lead update." }, { status: 400 });
  }
  await hasura(
    `mutation SetLead($id: uuid!, $clinicId: uuid!, $status: lead_status!) {
      update_leads(
        where: { id: { _eq: $id }, clinic_id: { _eq: $clinicId } }
        _set: { status: $status }
      ) { affected_rows }
    }`,
    { id: body.id, clinicId: session.clinicId, status: body.status },
  );
  return NextResponse.json({ ok: true });
}
