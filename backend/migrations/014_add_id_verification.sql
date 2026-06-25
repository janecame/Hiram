-- Manual government-ID verification (admin-reviewed).
-- States: unsubmitted -> pending -> verified / rejected (rejected users may re-submit).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
    CREATE TYPE verification_status AS ENUM ('unsubmitted', 'pending', 'verified', 'rejected');
  END IF; 
END$$;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS id_image_url        text,
  ADD COLUMN IF NOT EXISTS verification_status verification_status NOT NULL DEFAULT 'unsubmitted',
  ADD COLUMN IF NOT EXISTS id_rejection_reason text;

-- Backfill: anyone who already flagged an ID on file is treated as awaiting review.
UPDATE public.users
  SET verification_status = 'pending'
  WHERE id_submitted = true
    AND verification_status = 'unsubmitted';