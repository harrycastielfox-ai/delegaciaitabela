
CREATE TABLE public.invite_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  max_uses INTEGER NOT NULL DEFAULT 1,
  use_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can check if a code is valid (needed during signup)
CREATE POLICY "Anyone can read active invite codes"
ON public.invite_codes
FOR SELECT
USING (true);

-- Authenticated users can create invite codes
CREATE POLICY "Authenticated users can create invite codes"
ON public.invite_codes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Authenticated users can update their own codes
CREATE POLICY "Users can update their own invite codes"
ON public.invite_codes
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

-- Function to validate and consume an invite code (called during signup)
CREATE OR REPLACE FUNCTION public.use_invite_code(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.invite_codes
  SET use_count = use_count + 1
  WHERE code = p_code
    AND is_active = true
    AND use_count < max_uses;
  
  RETURN FOUND;
END;
$$;
