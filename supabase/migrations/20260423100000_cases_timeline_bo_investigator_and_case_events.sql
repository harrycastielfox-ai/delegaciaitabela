-- Add timeline/business fields for case registration and prepare operational history base.

ALTER TABLE IF EXISTS public.cases
  ADD COLUMN IF NOT EXISTS prazo TEXT,
  ADD COLUMN IF NOT EXISTS data_limite DATE,
  ADD COLUMN IF NOT EXISTS numero_bo TEXT,
  ADD COLUMN IF NOT EXISTS investigador_responsavel TEXT;

CREATE TABLE IF NOT EXISTS public.case_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL,
  tipo_evento TEXT NOT NULL,
  descricao TEXT,
  data_evento TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_case_events_case_id_data_evento
  ON public.case_events (case_id, data_evento DESC);

ALTER TABLE public.case_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'case_events'
      AND policyname = 'Authenticated users can read case events'
  ) THEN
    CREATE POLICY "Authenticated users can read case events"
      ON public.case_events
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'case_events'
      AND policyname = 'Authenticated users can insert case events'
  ) THEN
    CREATE POLICY "Authenticated users can insert case events"
      ON public.case_events
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END
$$;
