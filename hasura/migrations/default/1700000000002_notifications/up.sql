CREATE TABLE clinic_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  email_status text NOT NULL DEFAULT 'pending',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (appointment_id)
);

CREATE INDEX clinic_notifications_unread_idx
  ON clinic_notifications (clinic_id, created_at DESC)
  WHERE read_at IS NULL;
