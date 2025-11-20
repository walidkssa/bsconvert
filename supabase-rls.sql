-- BS Convert - Row Level Security Setup
-- Ce script configure RLS pour que chaque utilisateur voie uniquement ses données

-- 1. Ajouter la colonne user_id à la table conversions
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS conversions_user_id_idx ON conversions(user_id);

-- 3. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Allow all for now" ON conversions;
DROP POLICY IF EXISTS "Users can view their own conversions" ON conversions;
DROP POLICY IF EXISTS "Users can insert their own conversions" ON conversions;
DROP POLICY IF EXISTS "Users can update their own conversions" ON conversions;
DROP POLICY IF EXISTS "Users can delete their own conversions" ON conversions;

DROP POLICY IF EXISTS "Allow all for now" ON transactions;
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;

DROP POLICY IF EXISTS "Allow all for now" ON exports;
DROP POLICY IF EXISTS "Users can view their own exports" ON exports;
DROP POLICY IF EXISTS "Users can insert their own exports" ON exports;
DROP POLICY IF EXISTS "Users can delete their own exports" ON exports;

-- 4. Activer RLS (déjà fait normalement, mais on s'assure)
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

-- 5. Créer les politiques RLS pour la table conversions
CREATE POLICY "Users can view their own conversions"
  ON conversions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversions"
  ON conversions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversions"
  ON conversions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversions"
  ON conversions FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Créer les politiques RLS pour la table transactions
-- Les transactions sont liées aux conversions, donc on vérifie via la foreign key
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversions
      WHERE conversions.id = transactions.conversion_id
      AND conversions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversions
      WHERE conversions.id = transactions.conversion_id
      AND conversions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own transactions"
  ON transactions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversions
      WHERE conversions.id = transactions.conversion_id
      AND conversions.user_id = auth.uid()
    )
  );

-- 7. Créer les politiques RLS pour la table exports
CREATE POLICY "Users can view their own exports"
  ON exports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversions
      WHERE conversions.id = exports.conversion_id
      AND conversions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own exports"
  ON exports FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversions
      WHERE conversions.id = exports.conversion_id
      AND conversions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own exports"
  ON exports FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversions
      WHERE conversions.id = exports.conversion_id
      AND conversions.user_id = auth.uid()
    )
  );

-- 8. Créer une fonction pour définir automatiquement user_id
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Créer un trigger pour auto-remplir user_id lors de l'insertion
DROP TRIGGER IF EXISTS set_user_id_trigger ON conversions;
CREATE TRIGGER set_user_id_trigger
  BEFORE INSERT ON conversions
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();
