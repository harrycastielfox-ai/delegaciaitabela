-- Add missing fields used by the inquérito registration form.
-- Kept additive and backwards-compatible.

ALTER TABLE IF EXISTS public.cases
  ADD COLUMN IF NOT EXISTS data_do_fato DATE,
  ADD COLUMN IF NOT EXISTS autor_investigado TEXT,
  ADD COLUMN IF NOT EXISTS autor_det_indet TEXT,
  ADD COLUMN IF NOT EXISTS reu_preso BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS vinculado_faccao BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS nome_faccao TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cases'
      AND column_name = 'autor_det_indet'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public'
        AND t.relname = 'cases'
        AND c.conname = 'cases_autor_det_indet_check'
    ) THEN
      ALTER TABLE public.cases
        ADD CONSTRAINT cases_autor_det_indet_check
        CHECK (autor_det_indet IS NULL OR autor_det_indet IN ('Determinado', 'Indeterminado'));
    END IF;
  END IF;
END
$$;
