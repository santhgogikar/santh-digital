DELETE FROM users WHERE email = 'clinic@smilecare.demo';

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_scope;
ALTER TABLE users ADD CONSTRAINT users_clinic_required CHECK (
  (role = 'platform_admin' AND clinic_id IS NULL)
  OR (role <> 'platform_admin' AND clinic_id IS NOT NULL)
);

ALTER TABLE users DROP COLUMN IF EXISTS group_id;

ALTER TABLE clinics DROP CONSTRAINT IF EXISTS clinics_group_id_fkey;
ALTER TABLE clinics DROP COLUMN IF EXISTS group_id;
ALTER TABLE clinics DROP COLUMN IF EXISTS short_address;
ALTER TABLE clinics DROP COLUMN IF EXISTS full_address;
ALTER TABLE clinics DROP COLUMN IF EXISTS map_url;

DROP TABLE IF EXISTS clinic_groups;
