-- 017: avatar, default location, disabled flag on users; disabled flag on items; admin audit log

-- Users: avatar + default location/meetup
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url          TEXT,
  ADD COLUMN IF NOT EXISTS default_province    TEXT,
  ADD COLUMN IF NOT EXISTS default_city        TEXT,
  ADD COLUMN IF NOT EXISTS default_barangay    TEXT,
  ADD COLUMN IF NOT EXISTS default_address_detail TEXT,
  ADD COLUMN IF NOT EXISTS default_meetup      TEXT,
  ADD COLUMN IF NOT EXISTS disabled            BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS disabled_reason     TEXT,
  ADD COLUMN IF NOT EXISTS terms_accepted_at   TIMESTAMPTZ;

-- Items: admin disable flag
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS disabled        BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS disabled_reason TEXT;

-- Admin audit log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id    UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  target_type TEXT        NOT NULL,
  target_id   UUID        NOT NULL,
  action      TEXT        NOT NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_admin_id_idx   ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS admin_audit_log_target_idx     ON public.admin_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx ON public.admin_audit_log(created_at DESC);
