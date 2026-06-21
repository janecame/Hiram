CREATE TABLE public.requests (
  id          uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     uuid           NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  borrower_id uuid           NOT NULL REFERENCES public.users(id),
  lister_id   uuid           NOT NULL REFERENCES public.users(id),
  status      request_status NOT NULL DEFAULT 'pending',
  start_date  date           NOT NULL,
  end_date    date           NOT NULL,
  use_hours   boolean        NOT NULL DEFAULT false,
  message     text,
  created_at  timestamptz    NOT NULL DEFAULT now(),
  CONSTRAINT no_self_borrow  CHECK (borrower_id <> lister_id),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);
