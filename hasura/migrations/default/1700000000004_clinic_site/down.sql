ALTER TABLE clinics DROP CONSTRAINT IF EXISTS clinics_slot_duration_minutes_chk;
ALTER TABLE clinics DROP COLUMN IF EXISTS show_treatments;
ALTER TABLE clinics DROP COLUMN IF EXISTS show_doctors;
ALTER TABLE clinics DROP COLUMN IF EXISTS show_hours;
ALTER TABLE clinics DROP COLUMN IF EXISTS slot_duration_minutes;

DELETE FROM working_hours WHERE doctor_id IS NULL;
