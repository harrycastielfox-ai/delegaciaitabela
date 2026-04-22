ALTER TABLE public.audit_logs
  ALTER COLUMN case_id DROP NOT NULL;

DO $$
DECLARE
  fk_name text;
BEGIN
  SELECT c.conname
    INTO fk_name
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY (c.conkey)
  WHERE c.contype = 'f'
    AND n.nspname = 'public'
    AND t.relname = 'audit_logs'
    AND a.attname = 'case_id'
  LIMIT 1;

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.audit_logs DROP CONSTRAINT %I', fk_name);
  END IF;
END
$$;
