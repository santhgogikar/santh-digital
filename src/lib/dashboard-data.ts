import { hasura } from "./hasura";
import { rangeBounds } from "./date-range";

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

export async function getDashboardRange(clinicId: string, from: string, to: string) {
  const bounds = rangeBounds(from, to);
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
  }>(
    `query RangeDash($clinicId: uuid!, $start: timestamptz!, $end: timestamptz!) {
      appointments: appointments_aggregate(
        where: {
          clinic_id: { _eq: $clinicId }
          _and: [{ starts_at: { _gte: $start } }, { starts_at: { _lt: $end } }]
        }
      ) { aggregate { count } }
      pending: appointments_aggregate(
        where: {
          clinic_id: { _eq: $clinicId }
          status: { _eq: pending }
          _and: [{ starts_at: { _gte: $start } }, { starts_at: { _lt: $end } }]
        }
      ) { aggregate { count } }
      confirmed: appointments_aggregate(
        where: {
          clinic_id: { _eq: $clinicId }
          status: { _eq: confirmed }
          _and: [{ starts_at: { _gte: $start } }, { starts_at: { _lt: $end } }]
        }
      ) { aggregate { count } }
      completed: appointments_aggregate(
        where: {
          clinic_id: { _eq: $clinicId }
          status: { _eq: completed }
          _and: [{ starts_at: { _gte: $start } }, { starts_at: { _lt: $end } }]
        }
      ) { aggregate { count } }
      cancelled: appointments_aggregate(
        where: {
          clinic_id: { _eq: $clinicId }
          status: { _eq: cancelled }
          _and: [{ starts_at: { _gte: $start } }, { starts_at: { _lt: $end } }]
        }
      ) { aggregate { count } }
      no_show: appointments_aggregate(
        where: {
          clinic_id: { _eq: $clinicId }
          status: { _eq: no_show }
          _and: [{ starts_at: { _gte: $start } }, { starts_at: { _lt: $end } }]
        }
      ) { aggregate { count } }
      leads: leads_aggregate(
        where: {
          clinic_id: { _eq: $clinicId }
          _and: [{ created_at: { _gte: $start } }, { created_at: { _lt: $end } }]
        }
      ) { aggregate { count } }
      appointment_rows: appointments(
        where: {
          clinic_id: { _eq: $clinicId }
          _and: [{ starts_at: { _gte: $start } }, { starts_at: { _lt: $end } }]
        }
        order_by: { starts_at: asc }
        limit: 80
      ) {
        id
        booking_reference
        status
        starts_at
        doctor { name }
        service { name }
        patient { name mobile }
      }
      lead_rows: leads(
        where: {
          clinic_id: { _eq: $clinicId }
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
    { clinicId, start: bounds.start, end: bounds.endExclusive },
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
    appointments: data.appointment_rows,
    leads: data.lead_rows,
  };
}
