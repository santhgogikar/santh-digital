import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { hasura } from "@/lib/hasura";
import { formatDateTime } from "@/lib/format";
import { StatusSelect } from "@/components/status-select";
import { telLink, whatsappLink } from "@/lib/slug";
import { getDashboardScope } from "@/lib/scope";

export default async function LeadsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
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
        id name mobile requirement status created_at
      }
    }`,
    { clinicIds: scope.clinicIds },
  );

  return (
    <div>
      <h1 className="text-4xl">Leads</h1>
      <p className="mt-1 text-sm text-ink-soft">Callback requests from the website. Call, WhatsApp, then mark contacted or converted.</p>
      <div className="mt-6 grid gap-3">
        {data.leads.map((lead) => (
          <article key={lead.id} className="panel flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-semibold">{lead.name}</p>
              <p className="text-sm text-ink-soft">{lead.mobile} · {formatDateTime(lead.created_at)}</p>
              <p className="mt-2 text-sm">{lead.requirement}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a className="rounded-full bg-teal px-3 py-2 text-sm font-semibold text-white" href={telLink(lead.mobile)}>
                  Call
                </a>
                <a
                  className="rounded-full border border-teal px-3 py-2 text-sm font-semibold text-teal"
                  href={whatsappLink(lead.mobile, `Hello ${lead.name}, this is a callback from the clinic regarding: ${lead.requirement ?? "your enquiry"}.`)}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              </div>
            </div>
            <StatusSelect id={lead.id} value={lead.status} kind="lead" />
          </article>
        ))}
        {data.leads.length === 0 ? <p className="text-ink-soft">No website enquiries yet.</p> : null}
      </div>
    </div>
  );
}
