-- Representações Judiciais module (separate from cases)

CREATE TABLE IF NOT EXISTS public.representations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  ppe_linked TEXT NOT NULL,
  victim TEXT NULL,
  target_name TEXT NULL,
  representation_date DATE NOT NULL,
  representation_type TEXT NOT NULL,
  judicial_process_number TEXT NULL,
  court_branch TEXT NULL,
  deferimento_status TEXT NOT NULL DEFAULT 'nao',
  deferimento_date DATE NULL,
  granted_deadline_days INTEGER NULL,
  due_date DATE NULL,
  compliance_status TEXT NOT NULL DEFAULT 'nao',
  compliance_date DATE NULL,
  responsible_team TEXT NULL,
  diligence_result TEXT NULL,
  notes TEXT NULL,
  status TEXT NOT NULL DEFAULT 'em_analise',
  source_import_ref TEXT NULL,
  CONSTRAINT representations_deferimento_status_check
    CHECK (deferimento_status IN ('sim', 'nao', 'parcial')),
  CONSTRAINT representations_compliance_status_check
    CHECK (compliance_status IN ('sim', 'nao', 'parcial')),
  CONSTRAINT representations_granted_deadline_days_check
    CHECK (granted_deadline_days IS NULL OR granted_deadline_days >= 0),
  CONSTRAINT representations_status_check
    CHECK (status IN (
      'em_analise',
      'aguardando_analise_judicial',
      'deferida',
      'indeferida',
      'cumprida_parcial',
      'cumprida_total',
      'arquivada'
    ))
);

CREATE INDEX IF NOT EXISTS idx_representations_created_at
  ON public.representations (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_representations_ppe_linked
  ON public.representations (ppe_linked);

CREATE INDEX IF NOT EXISTS idx_representations_status
  ON public.representations (status);

CREATE INDEX IF NOT EXISTS idx_representations_representation_type
  ON public.representations (representation_type);

CREATE INDEX IF NOT EXISTS idx_representations_due_date
  ON public.representations (due_date);

ALTER TABLE public.representations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'representations'
      AND policyname = 'Authenticated users can read representations'
  ) THEN
    CREATE POLICY "Authenticated users can read representations"
      ON public.representations
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
      AND tablename = 'representations'
      AND policyname = 'Authenticated users can insert representations'
  ) THEN
    CREATE POLICY "Authenticated users can insert representations"
      ON public.representations
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'representations'
      AND policyname = 'Authenticated users can update representations'
  ) THEN
    CREATE POLICY "Authenticated users can update representations"
      ON public.representations
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;

DROP TRIGGER IF EXISTS update_representations_updated_at ON public.representations;

CREATE TRIGGER update_representations_updated_at
  BEFORE UPDATE ON public.representations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
