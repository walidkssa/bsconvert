import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixRLSPolicies() {
  console.log('🔧 FIXING RLS POLICIES\n');
  console.log('=' .repeat(60));

  console.log('\n⚠️  Les policies RLS doivent être mises à jour via le SQL Editor de Supabase.');
  console.log('\n📋 Instructions:');
  console.log('\n1. Allez sur: https://supabase.com/dashboard/project/silulzqcbmhypwpyggmo/editor');
  console.log('2. Cliquez sur "SQL Editor" dans le menu de gauche');
  console.log('3. Créez une nouvelle requête');
  console.log('4. Collez le SQL ci-dessous:\n');

  console.log('```sql');
  console.log(`-- Fix usage_tracking policies
DROP POLICY IF EXISTS "Users can view their own usage" ON usage_tracking;
DROP POLICY IF EXISTS "Users can insert their own usage" ON usage_tracking;
DROP POLICY IF EXISTS "Service role can insert usage" ON usage_tracking;

CREATE POLICY "Users can view their own usage"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
  ON usage_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can insert usage"
  ON usage_tracking FOR INSERT
  WITH CHECK (true);

-- Fix credit_transactions policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Service role can insert transactions" ON credit_transactions;

CREATE POLICY "Users can view their own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON credit_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can insert transactions"
  ON credit_transactions FOR INSERT
  WITH CHECK (true);

ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
`);
  console.log('```\n');
  console.log('5. Cliquez sur "RUN" (Ctrl+Enter)\n');
  console.log('=' .repeat(60));
}

fixRLSPolicies().catch(console.error);
