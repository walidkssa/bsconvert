-- Migration pour rendre user_id NOT NULL dans la table conversions
-- Cette migration garantit l'intégrité référentielle des données

-- ÉTAPE 1: Vérifier les conversions avec user_id NULL
-- (Exécuter ceci d'abord pour voir s'il y a des données à nettoyer)
SELECT
  id,
  file_name,
  created_at,
  user_id
FROM conversions
WHERE user_id IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- ÉTAPE 2: Supprimer les conversions orphelines (sans user_id)
-- ⚠️ ATTENTION: Cette opération est IRRÉVERSIBLE
-- Décommentez la ligne suivante si vous voulez supprimer les conversions sans user_id
-- DELETE FROM conversions WHERE user_id IS NULL;

-- ÉTAPE 3: Ajouter la contrainte NOT NULL sur user_id
-- Cette commande échouera s'il reste des user_id NULL
ALTER TABLE conversions
ALTER COLUMN user_id SET NOT NULL;

-- ÉTAPE 4: Ajouter un commentaire pour documentation
COMMENT ON COLUMN conversions.user_id IS 'User ID (required) - references auth.users';

-- ÉTAPE 5: Vérifier que la contrainte a été appliquée
SELECT
  table_name,
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'conversions'
  AND column_name = 'user_id';

-- ÉTAPE 6 (Optionnel): Ajouter une foreign key si elle n'existe pas déjà
-- Décommentez si vous voulez forcer l'intégrité référentielle
-- ALTER TABLE conversions
-- ADD CONSTRAINT fk_conversions_user
-- FOREIGN KEY (user_id)
-- REFERENCES auth.users(id)
-- ON DELETE CASCADE;
