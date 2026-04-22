-- Ensure deletion audit entries can be stored with case_id = NULL
-- and prevent hard FK coupling between audit_logs and cases.

ALTER TABLE public.audit_logs
  ALTER COLUMN case_id DROP NOT NULL;

DO $$
DECLARE
  fk_record RECORD;
BEGIN
  FOR fk_record IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY (c.conkey)
    JOIN pg_class ft ON ft.oid = c.confrelid
    JOIN pg_namespace fn ON fn.oid = ft.relnamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public'
      AND t.relname = 'audit_logs'
      AND a.attname = 'case_id'
      AND fn.nspname = 'public'
      AND ft.relname = 'cases'
  LOOP
    EXECUTE format('ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS %I', fk_record.conname);
  END LOOP;
END
$$;
