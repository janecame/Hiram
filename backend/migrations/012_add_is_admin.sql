ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

UPDATE public.users
  SET is_admin = true
  WHERE email = 'rianecuello@gmail.com';
