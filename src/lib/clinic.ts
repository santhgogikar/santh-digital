import { hasura } from "./hasura";
import type { ClinicRecord, WorkingHour } from "./types";

const CLINIC_FIELDS = `
  id
  name
  slug
  tagline
  phone
  short_address
  full_address
  map_url
  group {
    id
    name
    description
  }
  email
  logo_url
  brand_primary
  brand_deep
  brand_paper
  timezone
  booking_mode
  booking_buffer_minutes
  slot_duration_minutes
  show_treatments
  show_doctors
  show_hours
  about
  locations(order_by: { is_primary: desc }) {
    id
    name
    address_line1
    area
    city
    state
    pincode
    phone
    google_maps_url
    is_primary
  }
  doctors(where: { is_active: { _eq: true } }, order_by: { name: asc }) {
    id
    name
    slug
    qualification
    specialisation
    experience_years
    bio
    doctor_services {
      service {
        id
        name
        slug
      }
    }
  }
  services(where: { is_active: { _eq: true } }, order_by: { display_order: asc }) {
    id
    name
    slug
    description
    display_order
  }
  working_hours(where: { doctor_id: { _is_null: true } }, order_by: [{ day_of_week: asc }, { start_time: asc }]) {
    id
    doctor_id
    day_of_week
    start_time
    end_time
  }
`;

export async function getClinicBySlug(slug: string) {
  const data = await hasura<{ clinics: ClinicRecord[] }>(
    `query ClinicBySlug($slug: String!) {
      clinics(where: { slug: { _eq: $slug }, is_active: { _eq: true } }, limit: 1) {
        ${CLINIC_FIELDS}
      }
    }`,
    { slug },
  );
  return data.clinics[0] ?? null;
}

export async function getClinicById(id: string) {
  const data = await hasura<{ clinics_by_pk: ClinicRecord | null }>(
    `query ClinicById($id: uuid!) {
      clinics_by_pk(id: $id) {
        ${CLINIC_FIELDS}
      }
    }`,
    { id },
  );
  return data.clinics_by_pk;
}

export async function getClinicWorkingHours(clinicId: string) {
  const data = await hasura<{ working_hours: WorkingHour[] }>(
    `query ClinicHours($clinicId: uuid!) {
      working_hours(
        where: { clinic_id: { _eq: $clinicId }, doctor_id: { _is_null: true } }
        order_by: [{ day_of_week: asc }, { start_time: asc }]
      ) {
        id
        doctor_id
        day_of_week
        start_time
        end_time
      }
    }`,
    { clinicId },
  );
  if (data.working_hours.length) return data.working_hours;

  const fallback = await hasura<{ working_hours: WorkingHour[] }>(
    `query AnyHours($clinicId: uuid!) {
      working_hours(where: { clinic_id: { _eq: $clinicId } }, limit: 40) {
        id
        doctor_id
        day_of_week
        start_time
        end_time
      }
    }`,
    { clinicId },
  );
  return fallback.working_hours;
}

export async function getClinicHolidays(clinicId: string, from: string, to: string) {
  const data = await hasura<{ holidays: { on_date: string }[] }>(
    `query Holidays($clinicId: uuid!, $from: date!, $to: date!) {
      holidays(
        where: {
          clinic_id: { _eq: $clinicId }
          on_date: { _gte: $from, _lte: $to }
          doctor_id: { _is_null: true }
        }
      ) {
        on_date
      }
    }`,
    { clinicId, from, to },
  );
  return data.holidays.map((h) => h.on_date);
}

export async function getBusyAppointments(clinicId: string, fromIso: string, toIso: string) {
  const data = await hasura<{
    appointments: { starts_at: string; ends_at: string }[];
  }>(
    `query Busy($clinicId: uuid!, $from: timestamptz!, $to: timestamptz!) {
      appointments(
        where: {
          clinic_id: { _eq: $clinicId }
          status: { _nin: [cancelled, no_show] }
          _and: [
            { starts_at: { _gte: $from } }
            { starts_at: { _lt: $to } }
          ]
        }
      ) {
        starts_at
        ends_at
      }
    }`,
    { clinicId, from: fromIso, to: toIso },
  );
  return data.appointments;
}

export async function findUserByEmail(email: string) {
  const data = await hasura<{
    users: {
      id: string;
      email: string;
      password_hash: string;
      name: string;
      role: "platform_admin" | "clinic_admin" | "receptionist" | "doctor";
      clinic_id: string | null;
      group_id: string | null;
      is_active: boolean;
    }[];
  }>(
    `query UserByEmail($email: String!) {
      users(where: { email: { _eq: $email } }, limit: 1) {
        id
        email
        password_hash
        name
        role
        clinic_id
        group_id
        is_active
      }
    }`,
    { email },
  );
  return data.users[0] ?? null;
}
