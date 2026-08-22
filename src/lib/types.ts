export type BookingMode = "instant" | "request";

export type ClinicLocation = {
  id: string;
  name: string;
  address_line1: string;
  area: string | null;
  city: string;
  state: string;
  pincode: string | null;
  phone: string | null;
  google_maps_url: string | null;
  is_primary: boolean;
};

export type ClinicService = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  display_order: number;
};

export type ClinicDoctor = {
  id: string;
  name: string;
  slug: string;
  qualification: string | null;
  specialisation: string | null;
  experience_years: number | null;
  bio: string | null;
  doctor_services: { service: { id: string; name: string; slug: string } }[];
};

export type ClinicRecord = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  phone: string | null;
  email: string | null;
  timezone: string;
  booking_mode: BookingMode;
  booking_buffer_minutes: number;
  google_rating: number | null;
  google_review_count: number | null;
  about: string | null;
  locations: ClinicLocation[];
  doctors: ClinicDoctor[];
  services: ClinicService[];
};

export type WorkingHour = {
  id: string;
  doctor_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

export type BusyAppointment = {
  starts_at: string;
  ends_at: string;
};
