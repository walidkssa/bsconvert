-- ============================================
-- BS CONVERT - Performance Optimization Indexes
-- Date: 2025-01-20
-- Description: Ajoute les index manquants pour optimiser les requêtes fréquentes
-- ============================================

-- 1. INDEX POUR useDashboardStats - Requêtes sur conversions par user + date
-- Améliore les performances de récupération des stats mensuelles
CREATE INDEX IF NOT EXISTS idx_conversions_user_created
ON conversions(user_id, created_at DESC)
WHERE user_id IS NOT NULL;

-- 2. INDEX POUR distribution des banques - Group by bank_name
-- Optimise les statistiques par banque
CREATE INDEX IF NOT EXISTS idx_conversions_bank_status
ON conversions(bank_name, status)
WHERE bank_name IS NOT NULL;

-- 3. INDEX POUR les transactions par conversion
-- Accélère les jointures conversions <-> transactions
CREATE INDEX IF NOT EXISTS idx_transactions_conversion
ON transactions(conversion_id)
WHERE conversion_id IS NOT NULL;

-- 4. INDEX POUR usage_tracking par utilisateur
-- Optimise les requêtes de crédits utilisés
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_created
ON usage_tracking(user_id, created_at DESC)
WHERE user_id IS NOT NULL;

-- 5. INDEX POUR credit_transactions par utilisateur
-- Accélère l'historique des transactions de crédits
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created
ON credit_transactions(user_id, created_at DESC)
WHERE user_id IS NOT NULL;

-- 6. INDEX POUR subscriptions actives
-- Optimise la vérification des abonnements
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
ON subscriptions(user_id, status)
WHERE status = 'active';

-- 7. INDEX POUR user_profiles sur subscription_status
-- Accélère les vérifications d'abonnement dans middleware
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription
ON user_profiles(subscription_status)
WHERE subscription_status = 'active';

-- 8. INDEX POUR conversions par status (monitoring)
-- Utile pour les dashboards admin
CREATE INDEX IF NOT EXISTS idx_conversions_status_created
ON conversions(status, created_at DESC);

-- 9. INDEX COMPOSITE pour free_trial_ips
-- Optimise la vérification des essais gratuits par IP
CREATE INDEX IF NOT EXISTS idx_free_trial_ips_hash_created
ON free_trial_ips(ip_hash, created_at DESC);

-- ============================================
-- ANALYSE DES TABLES APRÈS CRÉATION DES INDEX
-- ============================================
ANALYZE conversions;
ANALYZE transactions;
ANALYZE usage_tracking;
ANALYZE credit_transactions;
ANALYZE subscriptions;
ANALYZE user_profiles;
ANALYZE free_trial_ips;

-- ============================================
-- VÉRIFICATION DES INDEX CRÉÉS
-- ============================================
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_indexes
JOIN pg_class ON pg_indexes.indexname = pg_class.relname
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
