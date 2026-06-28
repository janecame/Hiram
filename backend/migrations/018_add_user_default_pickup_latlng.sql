-- 018: default pickup map location on users (auto-fills the listing form's pin)

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS default_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS default_lng DOUBLE PRECISION;
