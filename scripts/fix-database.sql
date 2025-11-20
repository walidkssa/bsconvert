-- =====================================================
-- FIX MISSING COLUMNS IN CONVERSIONS TABLE
-- =====================================================

-- 1. Ajouter la colonne user_id si elle n'existe pas
ALTER TABLE conversions
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS conversions_user_id_idx ON conversions(user_id);

-- 3. Ajouter les colonnes de tracking de crédits si elles n'existent pas
ALTER TABLE conversions
  ADD COLUMN IF NOT EXISTS pages_count INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS credits_used INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_free_trial BOOLEAN DEFAULT FALSE;

-- 4. Créer les index
CREATE INDEX IF NOT EXISTS idx_conversions_pages_count ON conversions(pages_count);
CREATE INDEX IF NOT EXISTS idx_conversions_is_free_trial ON conversions(is_free_trial);
CREATE INDEX IF NOT EXISTS idx_conversions_credits_used ON conversions(credits_used);

-- 5. Créer une fonction pour définir automatiquement user_id
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set user_id if it's not already set and auth.uid() is available
  IF NEW.user_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Créer un trigger pour auto-remplir user_id lors de l'insertion
DROP TRIGGER IF EXISTS set_user_id_trigger ON conversions;
CREATE TRIGGER set_user_id_trigger
  BEFORE INSERT ON conversions
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

-- 7. Mettre à jour les conversions existantes sans user_id (s'il y en a)
-- Note: Ceci ne fonctionnera que si vous pouvez identifier l'utilisateur d'une autre manière
-- Sinon, ces conversions resteront sans user_id

-- 8. Vérifier que les policies RLS existent
DROP POLICY IF EXISTS "Users can view their own conversions" ON conversions;
CREATE POLICY "Users can view their own conversions"
  ON conversions FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert their own conversions" ON conversions;
CREATE POLICY "Users can insert their own conversions"
  ON conversions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update their own conversions" ON conversions;
CREATE POLICY "Users can update their own conversions"
  ON conversions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own conversions" ON conversions;
CREATE POLICY "Users can delete their own conversions"
  ON conversions FOR DELETE
  USING (auth.uid() = user_id);

-- 9. Activer RLS
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FIX COMPLETE
-- =====================================================

SELECT '✅ Migration terminée! Colonne user_id ajoutée à la table conversions.' as message;
