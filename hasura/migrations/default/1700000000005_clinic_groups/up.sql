CREATE TABLE IF NOT EXISTS clinic_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES clinic_groups(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS short_address text,
  ADD COLUMN IF NOT EXISTS full_address text,
  ADD COLUMN IF NOT EXISTS map_url text;

INSERT INTO clinic_groups (id, name, description) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  'Smile Care Dental',
  'Gentle dentistry for families in Mehdipatnam.'
) ON CONFLICT (id) DO NOTHING;

UPDATE clinics
SET
  group_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  short_address = COALESCE(short_address, 'Mehdipatnam, Hyderabad.'),
  full_address = COALESCE(
    full_address,
    '12-2-417/A, Pillar No. 32, Rethibowli Road
Mehdipatnam, Hyderabad, Telangana 500028'
  ),
  map_url = COALESCE(map_url, 'https://maps.google.com/?q=Mehdipatnam+Hyderabad')
WHERE id = '11111111-1111-1111-1111-111111111111';

INSERT INTO clinic_groups (name, description)
SELECT c.name, COALESCE(c.tagline, c.about)
FROM clinics c
WHERE c.group_id IS NULL;

UPDATE clinics c
SET group_id = g.id
FROM clinic_groups g
WHERE c.group_id IS NULL
  AND g.name = c.name
  AND g.id <> 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1';

UPDATE clinics
SET
  short_address = COALESCE(short_address, ''),
  full_address = COALESCE(full_address, ''),
  map_url = COALESCE(map_url, '')
WHERE short_address IS NULL OR full_address IS NULL OR map_url IS NULL;

ALTER TABLE clinics ALTER COLUMN group_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS clinic_groups_name_idx ON clinic_groups(name);
CREATE INDEX IF NOT EXISTS clinics_group_id_idx ON clinics(group_id);

ALTER TABLE users ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES clinic_groups(id) ON DELETE CASCADE;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_clinic_required;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_scope;
ALTER TABLE users ADD CONSTRAINT users_role_scope CHECK (
  (role = 'platform_admin' AND clinic_id IS NULL AND group_id IS NULL)
  OR (role = 'clinic_admin' AND group_id IS NOT NULL AND clinic_id IS NULL)
  OR (role = 'clinic_admin' AND clinic_id IS NOT NULL AND group_id IS NULL)
  OR (role IN ('receptionist', 'doctor') AND clinic_id IS NOT NULL)
);

UPDATE users
SET name = 'Branch Admin'
WHERE email = 'admin@smilecare.demo';

INSERT INTO users (id, clinic_id, group_id, email, password_hash, name, role)
VALUES (
  '33333333-3333-3333-3333-333333333335',
  NULL,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  'clinic@smilecare.demo',
  crypt('clinic123', gen_salt('bf')),
  'Clinic Admin',
  'clinic_admin'
) ON CONFLICT (email) DO NOTHING;
