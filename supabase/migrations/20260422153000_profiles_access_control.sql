ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT;

ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'investigador',
  ALTER COLUMN status SET DEFAULT 'pending';

UPDATE public.profiles
SET role = 'investigador'
WHERE role IS NULL
  OR role = ''
  OR role NOT IN ('delegado', 'escrivao', 'investigador', 'admin');

UPDATE public.profiles
SET status = 'active'
WHERE status IS NULL
  OR status = ''
  OR status NOT IN ('pending', 'active', 'blocked');

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('delegado', 'escrivao', 'investigador', 'admin'));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_status_check
  CHECK (status IN ('pending', 'active', 'blocked'));

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id
  AND (p.email IS NULL OR p.email = '');

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    'investigador',
    'pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Authenticated users can read profiles'
  ) THEN
    CREATE POLICY "Authenticated users can read profiles"
      ON public.profiles
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
      AND tablename = 'profiles'
      AND policyname = 'Authenticated users can update profiles'
  ) THEN
    CREATE POLICY "Authenticated users can update profiles"
      ON public.profiles
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;
