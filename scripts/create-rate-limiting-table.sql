-- Table pour le rate limiting des free trials
CREATE TABLE IF NOT EXISTS free_trial_rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  first_attempt_at TIMESTAMPTZ DEFAULT now(),
  last_attempt_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les requêtes rapides par IP
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_hash
ON free_trial_rate_limits(ip_hash);

-- Index pour nettoyer les anciennes entrées
CREATE INDEX IF NOT EXISTS idx_rate_limits_created_at
ON free_trial_rate_limits(created_at DESC);

-- Fonction pour nettoyer automatiquement les entrées de plus de 24h
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM free_trial_rate_limits
  WHERE created_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Commentaires pour documentation
COMMENT ON TABLE free_trial_rate_limits IS 'Rate limiting pour les free trials - limite les tentatives par IP';
COMMENT ON COLUMN free_trial_rate_limits.ip_hash IS 'Hash SHA-256 de l''IP client (RGPD compliant)';
COMMENT ON COLUMN free_trial_rate_limits.attempt_count IS 'Nombre de tentatives dans la fenêtre de temps';
COMMENT ON COLUMN free_trial_rate_limits.first_attempt_at IS 'Premier essai dans la fenêtre courante';
COMMENT ON COLUMN free_trial_rate_limits.last_attempt_at IS 'Dernier essai enregistré';
