ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS show_treatments boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_doctors boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_hours boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS slot_duration_minutes integer NOT NULL DEFAULT 30;

ALTER TABLE clinics DROP CONSTRAINT IF EXISTS clinics_slot_duration_minutes_chk;
ALTER TABLE clinics
  ADD CONSTRAINT clinics_slot_duration_minutes_chk
  CHECK (slot_duration_minutes IN (15, 30));

INSERT INTO working_hours (clinic_id, doctor_id, location_id, day_of_week, start_time, end_time)
SELECT DISTINCT
  clinic_id,
  NULL::uuid,
  location_id,
  day_of_week,
  start_time,
  end_time
FROM working_hours existing
WHERE existing.doctor_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM working_hours clinic_hours
    WHERE clinic_hours.clinic_id = existing.clinic_id
      AND clinic_hours.doctor_id IS NULL
  );
