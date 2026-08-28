ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS brand_primary text,
  ADD COLUMN IF NOT EXISTS brand_deep text,
  ADD COLUMN IF NOT EXISTS brand_paper text;

ALTER TABLE clinics DROP CONSTRAINT IF EXISTS clinics_brand_primary_hex;
ALTER TABLE clinics DROP CONSTRAINT IF EXISTS clinics_brand_deep_hex;
ALTER TABLE clinics DROP CONSTRAINT IF EXISTS clinics_brand_paper_hex;

ALTER TABLE clinics
  ADD CONSTRAINT clinics_brand_primary_hex CHECK (brand_primary IS NULL OR brand_primary ~ '^#[0-9A-Fa-f]{6}$'),
  ADD CONSTRAINT clinics_brand_deep_hex CHECK (brand_deep IS NULL OR brand_deep ~ '^#[0-9A-Fa-f]{6}$'),
  ADD CONSTRAINT clinics_brand_paper_hex CHECK (brand_paper IS NULL OR brand_paper ~ '^#[0-9A-Fa-f]{6}$');
