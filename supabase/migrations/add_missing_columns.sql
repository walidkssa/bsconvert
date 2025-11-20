-- Migration: Ajouter les colonnes manquantes à la table conversions
-- Date: 2025-11-16
-- Description: Ajoute csv_data, excel_data, period_start, period_end

-- Ajouter les colonnes pour stocker les données CSV et Excel
ALTER TABLE conversions
  ADD COLUMN IF NOT EXISTS csv_data TEXT,
  ADD COLUMN IF NOT EXISTS excel_data TEXT;

-- Ajouter les colonnes pour les dates de période
ALTER TABLE conversions
  ADD COLUMN IF NOT EXISTS period_start DATE,
  ADD COLUMN IF NOT EXISTS period_end DATE;

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS conversions_csv_data_idx
  ON conversions(id) WHERE csv_data IS NOT NULL;

CREATE INDEX IF NOT EXISTS conversions_excel_data_idx
  ON conversions(id) WHERE excel_data IS NOT NULL;

CREATE INDEX IF NOT EXISTS conversions_period_idx
  ON conversions(period_start, period_end);

-- Commentaires pour la documentation
COMMENT ON COLUMN conversions.csv_data IS 'Données CSV exportées de la conversion';
COMMENT ON COLUMN conversions.excel_data IS 'Données Excel en base64 de la conversion';
COMMENT ON COLUMN conversions.period_start IS 'Date de début de la période du relevé';
COMMENT ON COLUMN conversions.period_end IS 'Date de fin de la période du relevé';
