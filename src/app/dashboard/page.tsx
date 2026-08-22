import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getClinicById } from "@/lib/clinic";
import { getDashboardRange } from "@/lib/dashboard-data";
import { parseDashboardRange } from "@/lib/date-range";
import { formatDateTime } from "@/lib/format";
import { AppointmentCard } from "@/components/appointment-card";
import { DateRangeBar } from "@/components/date-range-bar";
import { StatusSelect } from "@/components/status-select";
import { telLink, whatsappLink } from "@/lib/slug";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardHome({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await getSession();
  if (!session?.clinicId) redirect("/login");
  const clinic = await getClinicById(session.clinicId);
  if (!clinic) redirect("/login");

  const params = await searchParams;
  const { from, to } = parseDashboardRange(params.from, params.to);
  const data = await getDashboardRange(session.clinicId, from, to);
  const sameDay = from === to;

  const cards = [
    { label: "Appointments", value: data.metrics.appointments },
    { label: "Pending", value: data.metrics.pending },
    { label: "Confirmed", value: data.metrics.confirmed },
    { label: "Completed", value: data.metrics.completed },
    { label: "Cancelled", value: data.metrics.cancelled },
    { label: "No-shows", value: data.metrics.no_show },
    { label: "Leads", value: data.metrics.leads },
  ];

  return (
    <div>
      <h1 className="text-3xl sm:text-4xl">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {sameDay ? `Metrics and details for ${from}.` : `Metrics and details from ${from} to ${to}.`}
      </p>
      <DateRangeBar from={from} to={to} />

      <h2 className="mt-8 text-2xl">Metrics</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="panel p-4">
            <p className="text-[11px] uppercase tracking-wider text-ink-soft">{card.label}</p>
            <p className="serif mt-1 text-3xl sm:text-4xl">{card.value}</p>
          </article>
        ))}
      </div>

      <h2 className="mt-8 text-2xl">Appointments</h2>
      <div className="mt-3 grid gap-3">
        {data.appointments.map((row) => (
          <AppointmentCard
            key={row.id}
            appointment={{
              id: row.id,
              booking_reference: row.booking_reference,
              status: row.status,
              starts_atLabel: formatDateTime(row.starts_at),
              doctorName: row.doctor.name,
              serviceName: row.service.name,
              patientName: row.patient.name,
              patientMobile: row.patient.mobile,
              clinicName: clinic.name,
            }}
          />
        ))}
        {data.appointments.length === 0 ? (
          <p className="text-sm text-ink-soft">No appointments in this date range.</p>
        ) : null}
      </div>

      <h2 className="mt-8 text-2xl">Leads</h2>
      <div className="mt-3 grid gap-3">
        {data.leads.map((lead) => (
          <article key={lead.id} className="panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{lead.name}</p>
                <p className="text-sm text-ink-soft">{formatDateTime(lead.created_at)}</p>
                <p className="mt-2 text-sm">{lead.requirement}</p>
              </div>
              <StatusSelect id={lead.id} value={lead.status} kind="lead" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <a className="rounded-full bg-teal px-3 py-2 text-sm font-semibold text-white" href={telLink(lead.mobile)}>
                Call
              </a>
              <a
                className="rounded-full border border-teal px-3 py-2 text-sm font-semibold text-teal"
                href={whatsappLink(lead.mobile, `Hello ${lead.name}, this is a callback from ${clinic.name}.`)}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            </div>
          </article>
        ))}
        {data.leads.length === 0 ? <p className="text-sm text-ink-soft">No leads in this date range.</p> : null}
      </div>
    </div>
  );
}
