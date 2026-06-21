CREATE TABLE public.items (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       uuid          NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title          text          NOT NULL,
  category       item_category NOT NULL,
  condition      item_condition NOT NULL,
  status         item_status   NOT NULL DEFAULT 'available',
  description    text          NOT NULL,
  brand          text,
  price_per_day  numeric(10,2) NOT NULL CHECK (price_per_day > 0),
  price_per_hour numeric(10,2)           CHECK (price_per_hour > 0),
  image_url      text,
  area           text          NOT NULL,
  requirements   text,
  quantity       integer       NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  created_at     timestamptz   NOT NULL DEFAULT now()
);
