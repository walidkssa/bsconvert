-- =====================================================
-- MIGRATION: Payment System with Subscriptions & Credits
-- Date: 2025-01-17
-- Description: Complete payment infrastructure for BS Convert
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USER PROFILES TABLE
-- Stores subscription status, credits, and Stripe info
-- =====================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  -- Identification
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,

  -- Subscription
  plan_tier VARCHAR(50) NOT NULL DEFAULT 'none',
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
  subscription_status VARCHAR(50) NOT NULL DEFAULT 'inactive',

  -- Credits (pages)
  credits_monthly_limit INT NOT NULL DEFAULT 0,
  credits_used_this_month INT NOT NULL DEFAULT 0,
  credits_remaining INT GENERATED ALWAYS AS (credits_monthly_limit - credits_used_this_month) STORED,

  -- Stripe
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,

  -- Billing Period
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_plan CHECK (plan_tier IN ('none', 'starter', 'professional', 'enterprise')),
  CONSTRAINT valid_billing_cycle CHECK (billing_cycle IN ('monthly', 'yearly')),
  CONSTRAINT valid_status CHECK (subscription_status IN ('inactive', 'active', 'past_due', 'canceled', 'trialing'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer ON user_profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_subscription ON user_profiles(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Comments
COMMENT ON TABLE user_profiles IS 'User subscription and credit information';
COMMENT ON COLUMN user_profiles.plan_tier IS 'Subscription plan: none, starter, professional, enterprise';
COMMENT ON COLUMN user_profiles.subscription_status IS 'Current subscription status';
COMMENT ON COLUMN user_profiles.credits_monthly_limit IS 'Total pages allowed per month based on plan';
COMMENT ON COLUMN user_profiles.credits_used_this_month IS 'Pages used in current billing period';
COMMENT ON COLUMN user_profiles.credits_remaining IS 'Calculated: limit - used';

-- =====================================================
-- 2. SUBSCRIPTIONS TABLE
-- Historical record of all subscriptions
-- =====================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Plan Details
  plan_tier VARCHAR(50) NOT NULL,
  billing_cycle VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Status
  status VARCHAR(50) NOT NULL,

  -- Stripe
  stripe_subscription_id TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,

  -- Billing Dates
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_sub_plan CHECK (plan_tier IN ('starter', 'professional', 'enterprise')),
  CONSTRAINT valid_sub_billing CHECK (billing_cycle IN ('monthly', 'yearly')),
  CONSTRAINT valid_sub_status CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing', 'unpaid'))
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);

COMMENT ON TABLE subscriptions IS 'Historical record of user subscriptions';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'Whether subscription will cancel at end of period';

-- =====================================================
-- 3. USAGE TRACKING TABLE
-- Log every conversion with page count
-- =====================================================

CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversion_id UUID REFERENCES conversions(id) ON DELETE SET NULL,

  -- Usage
  pages_processed INT NOT NULL,
  credits_deducted INT NOT NULL,

  -- Context
  file_name TEXT,
  file_type TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_created_at ON usage_tracking(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_conversion_id ON usage_tracking(conversion_id);

COMMENT ON TABLE usage_tracking IS 'Log of all conversions with page/credit usage';
COMMENT ON COLUMN usage_tracking.pages_processed IS 'Number of pages in the document';
COMMENT ON COLUMN usage_tracking.credits_deducted IS 'Credits deducted (usually = pages_processed)';

-- =====================================================
-- 4. CREDIT TRANSACTIONS TABLE
-- Audit trail of all credit changes
-- =====================================================

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Transaction
  transaction_type VARCHAR(50) NOT NULL,
  amount INT NOT NULL,

  -- Context
  description TEXT,
  reference_id UUID,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_transaction_type CHECK (
    transaction_type IN ('deduction', 'monthly_reset', 'refund', 'bonus', 'adjustment')
  )
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);

COMMENT ON TABLE credit_transactions IS 'Audit trail of all credit movements';
COMMENT ON COLUMN credit_transactions.amount IS 'Positive = credit added, Negative = credit deducted';
COMMENT ON COLUMN credit_transactions.reference_id IS 'Related conversion_id or subscription_id';

-- =====================================================
-- 5. FREE TRIAL IPS TABLE
-- Track IPs that used free trial (1x per IP)
-- =====================================================

CREATE TABLE IF NOT EXISTS free_trial_ips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- IP Tracking (hashed for GDPR)
  ip_hash TEXT NOT NULL UNIQUE,

  -- Usage
  conversions_count INT DEFAULT 1,
  last_conversion_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint: maximum 1 conversion
  CONSTRAINT max_one_conversion CHECK (conversions_count <= 1)
);

CREATE INDEX IF NOT EXISTS idx_free_trial_ips_hash ON free_trial_ips(ip_hash);
CREATE INDEX IF NOT EXISTS idx_free_trial_ips_created_at ON free_trial_ips(created_at);

COMMENT ON TABLE free_trial_ips IS 'Track IPs that used free trial to prevent abuse';
COMMENT ON COLUMN free_trial_ips.ip_hash IS 'SHA-256 hash of IP address (GDPR compliant)';

-- =====================================================
-- 6. MODIFY CONVERSIONS TABLE
-- Add page count and free trial tracking
-- =====================================================

ALTER TABLE conversions
  ADD COLUMN IF NOT EXISTS pages_count INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS credits_used INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_free_trial BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_conversions_pages_count ON conversions(pages_count);
CREATE INDEX IF NOT EXISTS idx_conversions_is_free_trial ON conversions(is_free_trial);
CREATE INDEX IF NOT EXISTS idx_conversions_credits_used ON conversions(credits_used);

COMMENT ON COLUMN conversions.pages_count IS 'Number of pages in uploaded document';
COMMENT ON COLUMN conversions.credits_used IS 'Credits deducted for this conversion';
COMMENT ON COLUMN conversions.is_free_trial IS 'Whether this was a free trial conversion';

-- =====================================================
-- 7. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: user_profiles updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: subscriptions updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Auto-create user_profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
-- free_trial_ips is server-only, no RLS needed

-- user_profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- usage_tracking policies
DROP POLICY IF EXISTS "Users can view own usage" ON usage_tracking;
CREATE POLICY "Users can view own usage"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

-- credit_transactions policies
DROP POLICY IF EXISTS "Users can view own credit transactions" ON credit_transactions;
CREATE POLICY "Users can view own credit transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- 9. HELPER FUNCTIONS FOR API
-- =====================================================

-- Function: Get user's current credit balance
CREATE OR REPLACE FUNCTION get_user_credits(user_uuid UUID)
RETURNS TABLE(
  credits_remaining INT,
  credits_used INT,
  credits_limit INT,
  subscription_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.credits_remaining,
    up.credits_used_this_month,
    up.credits_monthly_limit,
    up.subscription_status
  FROM user_profiles up
  WHERE up.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Deduct credits from user
CREATE OR REPLACE FUNCTION deduct_credits(
  user_uuid UUID,
  credits_to_deduct INT,
  conversion_uuid UUID,
  file_name_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INT;
BEGIN
  -- Get current credits
  SELECT credits_remaining INTO current_credits
  FROM user_profiles
  WHERE id = user_uuid;

  -- Check if enough credits
  IF current_credits < credits_to_deduct THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Deduct credits
  UPDATE user_profiles
  SET credits_used_this_month = credits_used_this_month + credits_to_deduct
  WHERE id = user_uuid;

  -- Log transaction
  INSERT INTO credit_transactions (user_id, transaction_type, amount, description, reference_id)
  VALUES (user_uuid, 'deduction', -credits_to_deduct, 'Conversion: ' || file_name_param, conversion_uuid);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Reset monthly credits (for cron job)
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS INT AS $$
DECLARE
  reset_count INT := 0;
BEGIN
  -- Reset all active subscriptions
  UPDATE user_profiles
  SET credits_used_this_month = 0
  WHERE subscription_status = 'active'
    AND current_period_end <= NOW();

  GET DIAGNOSTICS reset_count = ROW_COUNT;

  -- Log resets
  INSERT INTO credit_transactions (user_id, transaction_type, amount, description)
  SELECT
    id,
    'monthly_reset',
    credits_monthly_limit,
    'Monthly credit reset'
  FROM user_profiles
  WHERE subscription_status = 'active'
    AND current_period_end <= NOW();

  RETURN reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. INITIAL DATA & CLEANUP
-- =====================================================

-- Create profiles for existing users (if any)
INSERT INTO user_profiles (id, email, full_name)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', '')
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT ON subscriptions TO authenticated;
GRANT SELECT ON usage_tracking TO authenticated;
GRANT SELECT ON credit_transactions TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_user_credits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_credits(UUID, INT, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION reset_monthly_credits() TO service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Payment system migration completed successfully!';
  RAISE NOTICE '📊 Created tables: user_profiles, subscriptions, usage_tracking, credit_transactions, free_trial_ips';
  RAISE NOTICE '🔒 RLS policies enabled for all tables';
  RAISE NOTICE '⚙️  Helper functions created: get_user_credits, deduct_credits, reset_monthly_credits';
  RAISE NOTICE '🎯 Ready for Stripe integration!';
END $$;
