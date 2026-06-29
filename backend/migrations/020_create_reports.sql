CREATE TABLE IF NOT EXISTS public.reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  reporter_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reported_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason          text NOT NULL,
  description     text NOT NULL,
  status          text NOT NULL DEFAULT 'open',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reports_request_id_idx ON public.reports(request_id);
CREATE INDEX IF NOT EXISTS reports_reporter_id_idx ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS reports_reported_id_idx ON public.reports(reported_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports(status);
