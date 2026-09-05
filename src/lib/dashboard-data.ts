import { hasura } from "./hasura";
import { rangeBounds, todayYmd, type AppointmentView } from "./date-range";

const APPOINTMENT_FIELDS = `
  id
  booking_reference
  status
  starts_at
  doctor { name }
  service { name }
  patient { name mobile }
`;

export type DashboardAppointment = {
  id: string;
  booking_reference: string;
  status: string;
  starts_at: string;
  doctor: { name: string };
  service: { name: string };
  patient: { name: string; mobile: string };
};

export type DashboardLead = {
  id: string;
  name: string;
  mobile: string;
  requirement: string | null;
  status: string;
  created_at: string;
};

export type DashboardMetrics = {
  appointments: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  no_show: number;
  leads: number;
};

export function daySheetRows(rows: DashboardAppointment[]) {
  return rows.filter((row) => row.status !== "pending");
}

export const appointmentViewFilters: Record<AppointmentView, string> = {
  pending: `clinic_id: { _in: $clinicIds }, status: { _eq: pending }, starts_at: { _gte: $todayStart }`,
  today: `clinic_id: { _in: $clinicIds }, starts_at: { _gte: $todayStart, _lt: $tomorrowStart }, status: { _nin: [cancelled] }`,
  upcoming: `clinic_id: { _in: $clinicIds }, starts_at: { _gte: $todayStart }, status: { _in: [pending, confirmed] }`,
  past: `clinic_id: { _in: $clinicIds }, starts_at: { _lt: $todayStart }`,
};

export const appointmentViewOrder: Record<AppointmentView, string> = {
  pending: "{ starts_at: asc }",
  today: "{ starts_at: asc }",
  upcoming: "{ starts_at: asc }",
  past: "{ starts_at: desc }",
};

function emptyRange(from: string, to: string) {
  return {
    range: { from, to, start: "", endExclusive: "" },
    metrics: {
      appointments: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
      leads: 0,
    },
    inbox: { pendingUpcoming: 0, overduePending: 0 },
    needsConfirmation: [] as DashboardAppointment[],
    overduePending: [] as DashboardAppointment[],
    appointments: [] as DashboardAppointment[],
    daySheet: [] as DashboardAppointment[],
    leads: [] as DashboardLead[],
  };
}

export async function getDashboardRange(clinicIds: string[], from: string, to: string) {
  if (!clinicIds.length) return emptyRange(from, to);
  const bounds = rangeBounds(from, to);
  const todayStart = rangeBounds(todayYmd(), todayYmd()).start;
  const data = await hasura<{
    appointments: { aggregate: { count: number } };
    pending: { aggregate: { count: number } };
    confirmed: { aggregate: { count: number } };
    completed: { aggregate: { count: number } };
    cancelled: { aggregate: { count: number } };
    no_show: { aggregate: { count: number } };
    leads: { aggregate: { count: number } };
    appointment_rows: DashboardAppointment[];
    lead_rows: DashboardLead[];
    pending_upcoming: DashboardAppointment[];
    pending_upcoming_count: { aggregate: { count: number } };
    overdue_pending: DashboardAppointment[];
    overdue_pending_count: { aggregate: { count: number } };
  }>(
    `query RangeDash($clinicIds: [uuid!]!, $start: timestamptz!, $end: timestamptz!, $todayStart: timestamptz!) {
      appointments: appointments_aggregate(
        where: {
          clinic_id: { _in: $clinicIds }
          _and: [{ starts_at: { _gte: $start } }, { starts_at: { _lt: $end } }]
        }
      ) { aggregate { count } }
      pending: appointments_aggregate(
        where: {
          clinic_id: { _in: $clinicIds }
          status: { _eq: pending }
          _and: [{ starts_at: { _gte: $start } }, { starts_at: { _lt: $end } }]
        }
      ) { aggregate { count } }
      confirmed: appointments_aggregate(
        where: {
          clinic_id: { _in: $clinicIds }
          status: { _eq: confirmed }
          _and: [{ starts_at: { _gte: $start } }, { starts_at: { _lt: $end } }]
        }
      ) { aggregate { count } }
      completed: appointments_aggregate(
        where: {
          clinic_id: { _in: $clinicIds }
          status: { _eq: completed }
          _and: [{ starts_at: { _gte: $start } }, { starts_at: { _lt: $end } }]
        }
      ) { aggregate { count } }
      cancelled: appointments_aggregate(
        where: {
          clinic_id: { _in: $clinicIds }
          status: { _eq: cancelled }
          _and: [{ starts_at: { _gte: $start } }, { starts_at: { _lt: $end } }]
        }
      ) { aggregate { count } }
      no_show: appointments_aggregate(
        where: {
          clinic_id: { _in: $clinicIds }
          status: { _eq: no_show }
          _and: [{ starts_at: { _gte: $start } }, { starts_at: { _lt: $end } }]
        }
      ) { aggregate { count } }
      leads: leads_aggregate(
        where: {
          clinic_id: { _in: $clinicIds }
          _and: [{ created_at: { _gte: $start } }, { created_at: { _lt: $end } }]
        }
      ) { aggregate { count } }
      appointment_rows: appointments(
        where: {
          clinic_id: { _in: $clinicIds }
          _and: [{ starts_at: { _gte: $start } }, { starts_at: { _lt: $end } }]
        }
        order_by: { starts_at: asc }
        limit: 80
      ) {
        ${APPOINTMENT_FIELDS}
      }
      pending_upcoming: appointments(
        where: {
          clinic_id: { _in: $clinicIds }
          status: { _eq: pending }
          starts_at: { _gte: $todayStart }
        }
        order_by: { starts_at: asc }
        limit: 80
      ) {
        ${APPOINTMENT_FIELDS}
      }
      pending_upcoming_count: appointments_aggregate(
        where: {
          clinic_id: { _in: $clinicIds }
          status: { _eq: pending }
          starts_at: { _gte: $todayStart }
        }
      ) { aggregate { count } }
      overdue_pending: appointments(
        where: {
          clinic_id: { _in: $clinicIds }
          status: { _eq: pending }
          starts_at: { _lt: $todayStart }
        }
        order_by: { starts_at: desc }
        limit: 40
      ) {
        ${APPOINTMENT_FIELDS}
      }
      overdue_pending_count: appointments_aggregate(
        where: {
          clinic_id: { _in: $clinicIds }
          status: { _eq: pending }
          starts_at: { _lt: $todayStart }
        }
      ) { aggregate { count } }
      lead_rows: leads(
        where: {
          clinic_id: { _in: $clinicIds }
          _and: [{ created_at: { _gte: $start } }, { created_at: { _lt: $end } }]
        }
        order_by: { created_at: desc }
        limit: 80
      ) {
        id
        name
        mobile
        requirement
        status
        created_at
      }
    }`,
    { clinicIds, start: bounds.start, end: bounds.endExclusive, todayStart },
  );

  const metrics: DashboardMetrics = {
    appointments: data.appointments.aggregate.count,
    pending: data.pending.aggregate.count,
    confirmed: data.confirmed.aggregate.count,
    completed: data.completed.aggregate.count,
    cancelled: data.cancelled.aggregate.count,
    no_show: data.no_show.aggregate.count,
    leads: data.leads.aggregate.count,
  };

  return {
    range: { from: bounds.from, to: bounds.to, start: bounds.start, endExclusive: bounds.endExclusive },
    metrics,
    inbox: {
      pendingUpcoming: data.pending_upcoming_count.aggregate.count,
      overduePending: data.overdue_pending_count.aggregate.count,
    },
    needsConfirmation: data.pending_upcoming,
    overduePending: data.overdue_pending,
    appointments: data.appointment_rows,
    daySheet: daySheetRows(data.appointment_rows),
    leads: data.lead_rows,
  };
}

export async function listAppointmentsForView(clinicIds: string[], view: AppointmentView) {
  if (!clinicIds.length) return [];
  const todayStart = rangeBounds(todayYmd(), todayYmd()).start;
  const tomorrowStart = rangeBounds(todayYmd(), todayYmd()).endExclusive;
  const variables: Record<string, unknown> = { clinicIds, todayStart };
  if (view === "today") variables.tomorrowStart = tomorrowStart;

  const data = await hasura<{ appointments: DashboardAppointment[] }>(
    `query Bookings($clinicIds: [uuid!]!, $todayStart: timestamptz!${view === "today" ? ", $tomorrowStart: timestamptz!" : ""}) {
      appointments(where: { ${appointmentViewFilters[view]} }, order_by: ${appointmentViewOrder[view]}, limit: 80) {
        ${APPOINTMENT_FIELDS}
      }
    }`,
    variables,
  );

  return data.appointments;
}
