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
      leads: {
        id: string;
        name: string;
        mobile: string;
        requirement: string | null;
        status: string;
        created_at: string;
      }[];
    }>(
      `query Leads($clinicIds: [uuid!]!) {
        leads(where: { clinic_id: { _in: $clinicIds } }, order_by: { created_at: desc }, limit: 80) {
          id
          name
          mobile
          requirement
          status
          created_at
        }
      }`,
      { clinicIds: scope.clinicIds },
    );
    return NextResponse.json(data.leads);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireClinicSession();
    const scope = await getDashboardScope(session);
    const body = (await request.json()) as { id?: string; status?: string };
    const allowed = ["new", "contacted", "converted", "lost"];
    if (!body.id || !body.status || !allowed.includes(body.status)) {
      return NextResponse.json({ error: "Invalid lead update." }, { status: 400 });
    }
    await hasura(
      `mutation SetLead($id: uuid!, $clinicIds: [uuid!]!, $status: lead_status!) {
        update_leads(
          where: { id: { _eq: $id }, clinic_id: { _in: $clinicIds } }
          _set: { status: $status }
        ) { affected_rows }
      }`,
      { id: body.id, clinicIds: scope.clinicIds, status: body.status },
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
