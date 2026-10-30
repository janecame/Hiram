-- Stores a hashed, time-limited token for the forgot-password flow.
-- The raw token is only ever emailed to the user; only its hash is stored.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS reset_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;
