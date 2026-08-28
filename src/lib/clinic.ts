import { hasura } from "./hasura";
import type { ClinicRecord, WorkingHour } from "./types";

const CLINIC_FIELDS = `
  id
  name
  slug
  tagline
  phone
  email
  logo_url
  brand_primary
  brand_deep
  brand_paper
  timezone
  booking_mode
  booking_buffer_minutes
  google_rating
  google_review_count
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
    duration_minutes
    display_order
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

export async function getWorkingHours(clinicId: string, doctorId: string) {
  const data = await hasura<{ working_hours: WorkingHour[] }>(
    `query Hours($clinicId: uuid!, $doctorId: uuid!) {
      working_hours(
        where: {
          clinic_id: { _eq: $clinicId }
          _or: [{ doctor_id: { _eq: $doctorId } }, { doctor_id: { _is_null: true } }]
        }
      ) {
        id
        doctor_id
        day_of_week
        start_time
        end_time
      }
    }`,
    { clinicId, doctorId },
  );
  const doctorSpecific = data.working_hours.filter((h) => h.doctor_id === doctorId);
  return doctorSpecific.length ? doctorSpecific : data.working_hours;
}

export async function getHolidays(clinicId: string, doctorId: string, from: string, to: string) {
  const data = await hasura<{ holidays: { on_date: string }[] }>(
    `query Holidays($clinicId: uuid!, $doctorId: uuid!, $from: date!, $to: date!) {
      holidays(
        where: {
          clinic_id: { _eq: $clinicId }
          on_date: { _gte: $from, _lte: $to }
          _or: [{ doctor_id: { _eq: $doctorId } }, { doctor_id: { _is_null: true } }]
        }
      ) {
        on_date
      }
    }`,
    { clinicId, doctorId, from, to },
  );
  return data.holidays.map((h) => h.on_date);
}

export async function getBusyAppointments(
  doctorId: string,
  fromIso: string,
  toIso: string,
) {
  const data = await hasura<{
    appointments: { starts_at: string; ends_at: string }[];
  }>(
    `query Busy($doctorId: uuid!, $from: timestamptz!, $to: timestamptz!) {
      appointments(
        where: {
          doctor_id: { _eq: $doctorId }
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
    { doctorId, from: fromIso, to: toIso },
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
        is_active
      }
    }`,
    { email },
  );
  return data.users[0] ?? null;
}
