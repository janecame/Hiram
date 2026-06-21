CREATE TABLE public.reviews (
  id          uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  uuid     NOT NULL REFERENCES public.requests(id),
  reviewer_id uuid     NOT NULL REFERENCES public.users(id),
  reviewee_id uuid     NOT NULL REFERENCES public.users(id),
  item_id     uuid     NOT NULL REFERENCES public.items(id),
  rating      smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, reviewer_id)
);

CREATE VIEW public.item_ratings AS
SELECT
  item_id,
  ROUND(AVG(rating)::numeric, 1) AS avg_rating,
  COUNT(*)                        AS review_count
FROM public.reviews
GROUP BY item_id;
