-- 019: store PSGC codes alongside the display names (stable ids for prefilling pickers)

-- Items: code for each PSGC level
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS province_code TEXT,
  ADD COLUMN IF NOT EXISTS city_code     TEXT,
  ADD COLUMN IF NOT EXISTS barangay_code TEXT;

-- Users: code for each default-location PSGC level
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS default_province_code TEXT,
  ADD COLUMN IF NOT EXISTS default_city_code     TEXT,
  ADD COLUMN IF NOT EXISTS default_barangay_code TEXT;
