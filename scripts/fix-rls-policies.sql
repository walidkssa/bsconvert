-- =====================================================
-- FIX RLS POLICIES FOR usage_tracking AND credit_transactions
-- =====================================================

-- 1. Fix usage_tracking policies
DROP POLICY IF EXISTS "Users can view their own usage" ON usage_tracking;
DROP POLICY IF EXISTS "Users can insert their own usage" ON usage_tracking;
DROP POLICY IF EXISTS "Service role can insert usage" ON usage_tracking;

-- Allow users to view their own usage
CREATE POLICY "Users can view their own usage"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own usage
CREATE POLICY "Users can insert their own usage"
  ON usage_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow service role to insert usage (for API routes)
CREATE POLICY "Service role can insert usage"
  ON usage_tracking FOR INSERT
  WITH CHECK (true);

-- 2. Fix credit_transactions policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Service role can insert transactions" ON credit_transactions;

-- Allow users to view their own transactions
CREATE POLICY "Users can view their own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own transactions
CREATE POLICY "Users can insert their own transactions"
  ON credit_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow service role to insert transactions (for API routes)
CREATE POLICY "Service role can insert transactions"
  ON credit_transactions FOR INSERT
  WITH CHECK (true);

-- 3. Ensure RLS is enabled
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FIX COMPLETE
-- =====================================================

SELECT '✅ RLS policies fixed for usage_tracking and credit_transactions!' as message;
