-- Ensure `prazo` is stored as integer (days) and keep timeline columns available.

ALTER TABLE IF EXISTS public.cases
  ADD COLUMN IF NOT EXISTS prazo INTEGER,
  ADD COLUMN IF NOT EXISTS data_limite DATE;

DO $$
DECLARE
  prazo_data_type TEXT;
BEGIN
  SELECT c.data_type
    INTO prazo_data_type
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'cases'
    AND c.column_name = 'prazo';

  IF prazo_data_type = 'text' THEN
    ALTER TABLE public.cases
      ALTER COLUMN prazo TYPE INTEGER
      USING (
        CASE
          WHEN trim(prazo) ~ '^[0-9]+$' THEN trim(prazo)::INTEGER
          ELSE NULL
        END
      );
  END IF;
END
$$;
