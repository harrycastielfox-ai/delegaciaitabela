-- Allow spreadsheet imports that send prazo as decimal text (e.g. "30.0").
-- We still treat prazo as days in the app, but this avoids failing CSV import in Supabase.

ALTER TABLE IF EXISTS public.cases
  ALTER COLUMN prazo TYPE NUMERIC
  USING prazo::NUMERIC;
