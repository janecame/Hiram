CREATE TABLE public.blocked_dates (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  blocked_on date NOT NULL,
  UNIQUE (item_id, blocked_on)
);
