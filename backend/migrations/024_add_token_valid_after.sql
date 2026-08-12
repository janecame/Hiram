-- Tracks the earliest issue-time a user's JWT must have to still be accepted.
-- Bumped on password change or admin-disable so existing tokens can be invalidated early.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS token_valid_after TIMESTAMPTZ;
