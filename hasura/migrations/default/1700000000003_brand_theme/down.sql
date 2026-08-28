ALTER TABLE clinics DROP CONSTRAINT IF EXISTS clinics_brand_primary_hex;
ALTER TABLE clinics DROP CONSTRAINT IF EXISTS clinics_brand_deep_hex;
ALTER TABLE clinics DROP CONSTRAINT IF EXISTS clinics_brand_paper_hex;
ALTER TABLE clinics DROP COLUMN IF EXISTS brand_primary;
ALTER TABLE clinics DROP COLUMN IF EXISTS brand_deep;
ALTER TABLE clinics DROP COLUMN IF EXISTS brand_paper;
