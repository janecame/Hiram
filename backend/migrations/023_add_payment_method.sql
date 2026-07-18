-- Adds a payment method enum and column so payments can be marked paymongo or cash.

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('paymongo', 'cash');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS method payment_method NOT NULL DEFAULT 'paymongo';

CREATE INDEX IF NOT EXISTS payments_method_status_idx ON public.payments(method, status);
