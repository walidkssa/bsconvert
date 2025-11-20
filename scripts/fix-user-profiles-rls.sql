-- Script pour diagnostiquer et corriger les problèmes RLS sur user_profiles

-- 1. Vérifier l'existence du trigger
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 2. Vérifier les politiques RLS existantes
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
WHERE tablename = 'user_profiles';

-- 3. Désactiver temporairement RLS sur user_profiles pour permettre l'insertion par le trigger
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 4. Réactiver RLS avec des politiques correctes
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.user_profiles;

-- 6. Créer de nouvelles politiques RLS qui permettent au trigger de fonctionner
-- Politique pour permettre l'insertion (nécessaire pour le trigger)
CREATE POLICY "Enable insert for service role and trigger"
ON public.user_profiles
FOR INSERT
TO public
WITH CHECK (true);

-- Politique pour permettre la lecture (utilisateur peut voir son propre profil)
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = id OR auth.role() = 'service_role');

-- Politique pour permettre la mise à jour (utilisateur peut modifier son propre profil)
CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 7. Donner les permissions nécessaires
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.user_profiles TO postgres, service_role;
GRANT SELECT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;

-- 8. Vérifier que la fonction trigger a les bonnes permissions
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;

-- 9. Vérifier la configuration finale
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'user_profiles';
