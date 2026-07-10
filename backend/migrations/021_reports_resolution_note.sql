ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS resolution_note text;
