-- One-time reconciliation of a divergent legacy payments table with the PayMongo
-- design. The migration runner has no tracking table and re-runs every file each
-- time, so the destructive drop is guarded: it only fires when the legacy shape
-- (the old 'provider' column) is present, making this a no-op on every later run.

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'provider'
  ) THEN
    DROP TABLE public.payments CASCADE;
    DROP TYPE payment_status;
  END IF;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.payments (
  id                            uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id                    uuid           NOT NULL UNIQUE REFERENCES public.requests(id) ON DELETE CASCADE,
  borrower_id                   uuid           NOT NULL REFERENCES public.users(id),
  lister_id                     uuid           NOT NULL REFERENCES public.users(id),
  amount                        numeric(10,2)  NOT NULL CHECK (amount > 0),
  status                        payment_status NOT NULL DEFAULT 'pending',
  paymongo_checkout_session_id  text           UNIQUE,
  paymongo_payment_id           text,
  checkout_url                  text,
  paid_at                       timestamptz,
  created_at                    timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_request_idx ON public.payments(request_id);
CREATE INDEX IF NOT EXISTS payments_checkout_session_idx ON public.payments(paymongo_checkout_session_id);
