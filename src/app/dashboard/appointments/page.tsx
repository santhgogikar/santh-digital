import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listAppointmentsForView } from "@/lib/dashboard-data";
import { parseAppointmentView } from "@/lib/date-range";
import { AppointmentList } from "@/components/appointment-list";
import { getDashboardScope } from "@/lib/scope";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const views = [
  { id: "pending", label: "Needs confirmation" },
  { id: "today", label: "Today" },
  { id: "upcoming", label: "All upcoming" },
  { id: "past", label: "Past" },
] as const;

const copy: Record<(typeof views)[number]["id"], { title: string; hint: string; empty: string }> = {
  pending: {
    title: "Needs confirmation",
    hint: "Website requests from today onward, soonest first. Call the patient, then confirm.",
    empty: "No open requests.",
  },
  today: {
    title: "Today",
    hint: "Everyone due in the chair today, including pending requests.",
    empty: "No visits today.",
  },
  upcoming: {
    title: "All upcoming",
    hint: "Pending and confirmed visits from today onward.",
    empty: "No upcoming bookings.",
  },
  past: {
    title: "Past",
    hint: "Earlier visits, newest first.",
    empty: "No past bookings yet.",
  },
};

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const scope = await getDashboardScope(session);

  const view = parseAppointmentView((await searchParams).view);
  const rows = await listAppointmentsForView(scope.clinicIds, view);
  const meta = copy[view];

  return (
    <div>
      <h1 className="text-3xl sm:text-4xl">Bookings</h1>
      <p className="mt-1 text-sm text-ink-soft">{meta.hint}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {views.map((item) => {
          const active = item.id === view;
          return (
            <Link
              key={item.id}
              href={`/dashboard/appointments?view=${item.id}`}
              className={`rounded-full px-3 py-2 text-sm font-medium ${
                active ? "bg-teal text-white" : "bg-white text-ink ring-1 ring-line"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <h2 className="mt-8 text-2xl">{meta.title}</h2>
      <AppointmentList rows={rows} clinicName={scope.groupName} empty={meta.empty} />
    </div>
  );
}
