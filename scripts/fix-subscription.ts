import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fix() {
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: 'active',
      plan_tier: 'starter',
      billing_cycle: 'monthly',
      credits_monthly_limit: 500,
      credits_used_this_month: 0,
      stripe_customer_id: 'cus_TRRoBmxN0VlIRK',
      stripe_subscription_id: 'sub_1SUZ7QGvVp3BcsE87WGQE8Xn',
    })
    .eq('id', '6af7be1e-6843-4ec7-932f-41e68d4146a2');

  if (error) {
    console.error('ERREUR:', error);
  } else {
    console.log('✅ ABONNEMENT ACTIVÉ AVEC SUCCÈS !');
    console.log('   Plan: Starter (monthly)');
    console.log('   Crédits: 500 pages');
  }
}

fix();
