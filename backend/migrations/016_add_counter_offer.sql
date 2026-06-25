-- Add counter_offered status to request_status enum
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'counter_offered';

-- Add proposed date columns for counter-offer feature
ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS proposed_start_date DATE,
  ADD COLUMN IF NOT EXISTS proposed_end_date   DATE;
