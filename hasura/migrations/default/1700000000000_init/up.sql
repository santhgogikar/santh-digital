CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE user_role AS ENUM (
  'platform_admin',
  'clinic_admin',
  'receptionist',
  'doctor'
);

CREATE TYPE appointment_status AS ENUM (
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TYPE booking_mode AS ENUM ('instant', 'request');

CREATE TYPE lead_status AS ENUM (
  'new',
  'contacted',
  'converted',
  'lost'
);

CREATE TYPE appointment_source AS ENUM ('online', 'dashboard');

CREATE TABLE clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  tagline text,
  phone text,
  email text,
  logo_url text,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  booking_mode booking_mode NOT NULL DEFAULT 'instant',
  booking_buffer_minutes integer NOT NULL DEFAULT 30,
  google_rating numeric(2,1),
  google_review_count integer,
  about text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  address_line1 text NOT NULL,
  area text,
  city text NOT NULL DEFAULT 'Hyderabad',
  state text NOT NULL DEFAULT 'Telangana',
  pincode text,
  phone text,
  google_maps_url text,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX locations_clinic_id_idx ON locations(clinic_id);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name text NOT NULL,
  role user_role NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_clinic_required CHECK (
    (role = 'platform_admin' AND clinic_id IS NULL)
    OR (role <> 'platform_admin' AND clinic_id IS NOT NULL)
  )
);

CREATE INDEX users_clinic_id_idx ON users(clinic_id);

CREATE TABLE doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL,
  photo_url text,
  qualification text,
  specialisation text,
  experience_years integer,
  bio text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, slug)
);

CREATE INDEX doctors_clinic_id_idx ON doctors(clinic_id);

CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, slug)
);

CREATE INDEX services_clinic_id_idx ON services(clinic_id);

CREATE TABLE doctor_services (
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (doctor_id, service_id)
);

CREATE TABLE working_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES doctors(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  CHECK (end_time > start_time)
);

CREATE INDEX working_hours_lookup_idx ON working_hours(clinic_id, doctor_id, day_of_week);

CREATE TABLE holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES doctors(id) ON DELETE CASCADE,
  on_date date NOT NULL,
  name text,
  UNIQUE (clinic_id, doctor_id, on_date)
);

CREATE TABLE patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  mobile text NOT NULL,
  email text,
  is_existing boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, mobile)
);

CREATE INDEX patients_clinic_id_idx ON patients(clinic_id);

CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  name text NOT NULL,
  mobile text NOT NULL,
  email text,
  requirement text,
  status lead_status NOT NULL DEFAULT 'new',
  source text NOT NULL DEFAULT 'website',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX leads_clinic_status_idx ON leads(clinic_id, status, created_at DESC);

CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id),
  doctor_id uuid NOT NULL REFERENCES doctors(id),
  service_id uuid NOT NULL REFERENCES services(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status appointment_status NOT NULL DEFAULT 'confirmed',
  booking_reference text NOT NULL UNIQUE,
  notes text,
  source appointment_source NOT NULL DEFAULT 'online',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX appointments_clinic_starts_idx ON appointments(clinic_id, starts_at);
CREATE INDEX appointments_doctor_starts_idx ON appointments(doctor_id, starts_at);

ALTER TABLE appointments
  ADD CONSTRAINT appointments_no_overlap
  EXCLUDE USING gist (
    doctor_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  )
  WHERE (status NOT IN ('cancelled', 'no_show'));

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clinics_updated_at BEFORE UPDATE ON clinics
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER locations_updated_at BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER doctors_updated_at BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
