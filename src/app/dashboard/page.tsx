import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getClinicById } from "@/lib/clinic";
import { getDashboardRange } from "@/lib/dashboard-data";
import { parseDashboardRange } from "@/lib/date-range";
import { formatDateTime } from "@/lib/format";
import { AppointmentList } from "@/components/appointment-list";
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

  const rangeCards = [
    { label: "Appointments", value: data.metrics.appointments },
    { label: "Pending in range", value: data.metrics.pending },
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
        Confirm new website bookings first. The date range below is the day sheet and report — not the inbox.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <article className="panel p-4">
          <p className="text-[11px] uppercase tracking-wider text-ink-soft">Needs confirmation</p>
          <p className="serif mt-1 text-3xl sm:text-4xl">{data.inbox.pendingUpcoming}</p>
          <p className="mt-1 text-xs text-ink-soft">Pending from today onward</p>
        </article>
        <article className="panel p-4">
          <p className="text-[11px] uppercase tracking-wider text-ink-soft">Overdue pending</p>
          <p className="serif mt-1 text-3xl sm:text-4xl">{data.inbox.overduePending}</p>
          <p className="mt-1 text-xs text-ink-soft">Slot already passed — cancel or call</p>
        </article>
      </div>

      <div className="mt-8 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl">Needs confirmation</h2>
          <p className="mt-1 text-sm text-ink-soft">Call or WhatsApp, then confirm. Includes future dates.</p>
        </div>
        <Link href="/dashboard/appointments?view=pending" className="hidden text-sm text-teal sm:inline">
          Open bookings
        </Link>
      </div>
      <AppointmentList
        rows={data.needsConfirmation}
        clinicName={clinic.name}
        empty="No open requests. New website bookings will appear here even if the visit is next week."
      />

      {data.overduePending.length > 0 ? (
        <>
          <h2 className="mt-8 text-2xl">Past slots still pending</h2>
          <p className="mt-1 text-sm text-ink-soft">These still block the diary until you cancel or mark no-show.</p>
          <AppointmentList rows={data.overduePending} clinicName={clinic.name} empty="" />
        </>
      ) : null}

      <h2 className="mt-10 text-2xl">Day sheet and report</h2>
      <p className="mt-1 text-sm text-ink-soft">
        {sameDay ? `Visits and leads for ${from}.` : `Visits and leads from ${from} to ${to}.`} Pending
        requests stay in the inbox above.
      </p>
      <DateRangeBar from={from} to={to} />

      <h3 className="mt-8 text-xl">Metrics in this range</h3>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {rangeCards.map((card) => (
          <article key={card.label} className="panel p-4">
            <p className="text-[11px] uppercase tracking-wider text-ink-soft">{card.label}</p>
            <p className="serif mt-1 text-3xl sm:text-4xl">{card.value}</p>
          </article>
        ))}
      </div>

      <h3 className="mt-8 text-xl">Visits in this range</h3>
      <AppointmentList
        rows={data.daySheet}
        clinicName={clinic.name}
        empty="No confirmed, completed, or cancelled visits in this date range. Pending requests are listed in Needs confirmation."
      />

      <h3 className="mt-8 text-xl">Leads in this range</h3>
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
