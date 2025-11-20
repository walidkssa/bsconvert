// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia' as any,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// REMPLACEZ CE SESSION_ID PAR CELUI QUE VOUS AVEZ DANS VOTRE URL
const SESSION_ID = 'cs_live_b1kxf7QCYVOEt0D2Oq0pNJ9SBvxzbwmu7O9Q4w1Dz4zmc97A9bwxGcg5Mp';

async function activateSubscription() {
  console.log('🔍 Récupération de la session Stripe...');

  const session = await stripe.checkout.sessions.retrieve(SESSION_ID);

  console.log('📧 Email:', session.customer_email);
  console.log('💰 Montant:', (session.amount_total || 0) / 100, session.currency);
  console.log('✅ Statut paiement:', session.payment_status);

  if (session.payment_status !== 'paid') {
    console.log('❌ Le paiement n\'est pas complété');
    return;
  }

  const planTier = session.metadata?.plan_tier;
  const billingCycle = session.metadata?.billing_cycle;
  const subscriptionId = session.subscription as string;

  console.log('📦 Plan:', planTier, '-', billingCycle);
  console.log('🔑 Subscription ID:', subscriptionId);

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Calculer les crédits
  const creditsMap: any = {
    'starter-monthly': 500,
    'starter-yearly': 6000,
    'professional-monthly': 1500,
    'professional-yearly': 18000,
    'enterprise-monthly': 10000,
    'enterprise-yearly': 120000,
  };

  const creditsLimit = creditsMap[`${planTier}-${billingCycle}`] || 500;

  console.log('💳 Crédits:', creditsLimit, 'pages');

  // Trouver l'utilisateur par email
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === session.customer_email);

  if (!user) {
    console.log('❌ Utilisateur non trouvé avec cet email');
    return;
  }

  console.log('👤 User ID:', user.id);

  // Mettre à jour le profil
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: 'active',
      plan_tier: planTier,
      billing_cycle: billingCycle,
      credits_monthly_limit: creditsLimit,
      credits_used_this_month: 0,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscriptionId,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('❌ Erreur mise à jour profil:', updateError);
    return;
  }

  console.log('✅ Profil mis à jour !');

  // Créer l'entrée subscription
  await supabase
    .from('subscriptions')
    .insert({
      user_id: user.id,
      plan_tier: planTier,
      billing_cycle: billingCycle,
      amount: (session.amount_total || 0) / 100,
      currency: session.currency || 'eur',
      status: 'active',
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: session.customer as string,
      stripe_price_id: subscription.items.data[0].price.id,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    });

  console.log('✅ Subscription créée !');

  // Logger la transaction
  await supabase
    .from('credit_transactions')
    .insert({
      user_id: user.id,
      transaction_type: 'monthly_reset',
      amount: creditsLimit,
      description: `Activation manuelle: ${planTier} plan (${billingCycle})`,
    });

  console.log('✅ Transaction de crédit enregistrée !');
  console.log('');
  console.log('🎉 ABONNEMENT ACTIVÉ AVEC SUCCÈS !');
  console.log(`   Plan: ${planTier} (${billingCycle})`);
  console.log(`   Crédits: ${creditsLimit} pages`);
}

activateSubscription().catch(console.error);
