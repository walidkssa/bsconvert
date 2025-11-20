-- Fix trigger permissions and RLS policies for user profile creation
-- This ensures the trigger can create profiles even with RLS enabled

-- 1. Drop and recreate the trigger function with proper permissions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER  -- This is critical - runs with creator's permissions
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert user profile with default values
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    plan_tier,
    subscription_status,
    credits
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'none',
    'inactive',
    0
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, ignore
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail auth user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 2. Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Grant necessary permissions to the function owner
GRANT ALL ON public.user_profiles TO postgres;
GRANT ALL ON public.conversions TO postgres;

-- 4. Update RLS policies to allow trigger to insert
-- First, check if RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_profiles;

-- Create comprehensive RLS policies
-- Allow authenticated users to read their own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- CRITICAL: Allow service role to insert (for trigger)
CREATE POLICY "Service role can insert profiles"
  ON public.user_profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- CRITICAL: Allow inserts during signup (bypass RLS for new users)
CREATE POLICY "Allow insert during signup"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 5. Verify the trigger is created
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 6. Verify RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- 7. Test the trigger function manually
-- (This will fail if there's no test user, but shows the function works)
-- SELECT public.handle_new_user();
