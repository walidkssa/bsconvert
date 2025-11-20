-- Script de diagnostic complet pour identifier le problème

-- 1. Vérifier la structure de la table user_profiles
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 2. Vérifier toutes les contraintes sur user_profiles
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.user_profiles'::regclass;

-- 3. Tester manuellement l'insertion d'un profil utilisateur
-- (Remplacer 'test-uuid' par un UUID réel d'un utilisateur dans auth.users)
DO $$
DECLARE
    test_user_id uuid;
    test_email text;
BEGIN
    -- Récupérer un utilisateur de test depuis auth.users
    SELECT id, email INTO test_user_id, test_email
    FROM auth.users
    LIMIT 1;

    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Test avec user_id: %, email: %', test_user_id, test_email;

        -- Tester l'insertion
        BEGIN
            INSERT INTO public.user_profiles (
                id,
                email,
                full_name,
                credits,
                subscription_tier,
                subscription_status,
                created_at,
                updated_at
            )
            VALUES (
                gen_random_uuid(),  -- Nouveau UUID pour le test
                'test_' || test_email,
                'Test User',
                0,
                'free',
                'inactive',
                NOW(),
                NOW()
            );
            RAISE NOTICE 'Test insertion réussie!';

            -- Supprimer le test
            DELETE FROM public.user_profiles WHERE email = 'test_' || test_email;
            RAISE NOTICE 'Test nettoyé';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erreur lors du test: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Aucun utilisateur trouvé dans auth.users';
    END IF;
END $$;

-- 4. Vérifier les logs d'erreur récents dans Postgres
-- (Cette partie nécessite les privilèges superuser)
SELECT * FROM pg_stat_statements
WHERE query LIKE '%user_profiles%'
ORDER BY last_exec_time DESC
LIMIT 5;
