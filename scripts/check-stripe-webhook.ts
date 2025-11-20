import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkWebhookStatus() {
  console.log('🔍 VÉRIFICATION DU STATUT APRÈS UPGRADE\n');
  console.log('=' .repeat(80));

  const userId = '6af7be1e-6843-4ec7-932f-41e68d4146a2';

  try {
    // 1. Vérifier le profil utilisateur
    console.log('\n1️⃣ PROFIL UTILISATEUR');
    console.log('-'.repeat(80));

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ Erreur:', profileError);
      return;
    }

    console.log(`Email: ${profile.email}`);
    console.log(`Plan: ${profile.plan_tier}`);
    console.log(`Billing: ${profile.billing_cycle}`);
    console.log(`Status: ${profile.subscription_status}`);
    console.log(`Stripe Customer ID: ${profile.stripe_customer_id}`);
    console.log(`Stripe Subscription ID: ${profile.stripe_subscription_id}`);
    console.log(`\n💳 CRÉDITS:`);
    console.log(`   Limite: ${profile.credits_monthly_limit}`);
    console.log(`   Utilisés: ${profile.credits_used_this_month}`);
    console.log(`   Restants: ${(profile.credits_monthly_limit || 0) - (profile.credits_used_this_month || 0)}`);

    // 2. Vérifier les dernières transactions
    console.log('\n2️⃣ DERNIÈRES TRANSACTIONS DE CRÉDITS');
    console.log('-'.repeat(80));

    const { data: transactions } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (transactions && transactions.length > 0) {
      transactions.forEach((tx, i) => {
        console.log(`\n[${i + 1}] ${new Date(tx.created_at).toLocaleString()}`);
        console.log(`   Type: ${tx.transaction_type}`);
        console.log(`   Amount: ${tx.amount}`);
        console.log(`   Description: ${tx.description}`);
      });
    } else {
      console.log('❌ Aucune transaction trouvée');
    }

    // 3. Vérifier les subscriptions
    console.log('\n3️⃣ ABONNEMENTS');
    console.log('-'.repeat(80));

    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (subs && subs.length > 0) {
      subs.forEach((sub, i) => {
        console.log(`\n[${i + 1}] ${new Date(sub.created_at).toLocaleString()}`);
        console.log(`   Plan: ${sub.plan_tier} (${sub.billing_cycle})`);
        console.log(`   Status: ${sub.status}`);
        console.log(`   Stripe Sub ID: ${sub.stripe_subscription_id}`);
        console.log(`   Amount: ${sub.amount} ${sub.currency}`);
      });
    } else {
      console.log('❌ Aucun abonnement trouvé');
    }

    // 4. DIAGNOSTIC
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 DIAGNOSTIC');
    console.log('-'.repeat(80));

    const expectedCredits = profile.plan_tier === 'pro' ? 10000 : profile.plan_tier === 'business' ? 50000 : 500;
    const hasCorrectLimit = profile.credits_monthly_limit === expectedCredits;

    console.log(`\nPlan actuel: ${profile.plan_tier}`);
    console.log(`Crédits attendus: ${expectedCredits}`);
    console.log(`Crédits configurés: ${profile.credits_monthly_limit}`);

    if (!hasCorrectLimit) {
      console.log('\n❌ PROBLÈME DÉTECTÉ: Les crédits ne correspondent pas au plan!');
      console.log('\n💡 SOLUTION: Le webhook Stripe n\'a probablement pas été déclenché.');
      console.log('\n🔧 ACTIONS À FAIRE:');
      console.log('   1. Vérifier les webhooks dans Stripe Dashboard');
      console.log('   2. Vérifier que l\'URL webhook est correcte');
      console.log('   3. Forcer une mise à jour manuelle');
    } else if (profile.credits_used_this_month > 0) {
      console.log('\n⚠️  PROBLÈME DÉTECTÉ: Les crédits n\'ont pas été réinitialisés!');
      console.log('\n💡 Le webhook a mis à jour la limite mais pas réinitialisé les crédits utilisés.');
    } else {
      console.log('\n✅ TOUT EST CORRECT!');
    }

    console.log('');

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

checkWebhookStatus().catch(console.error);
