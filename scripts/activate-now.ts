// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function activate() {
  // Récupérer la session
  const session = await stripe.checkout.sessions.retrieve(
    'cs_live_b1kxf7QCYVOEt0D2Oq0pNJ9SBvxzbwmu7O9Q4w1Dz4zmc97A9bwxGcg5Mp'
  );

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  console.log('Customer ID:', customerId);

  // Récupérer le customer Stripe
  const customer = await stripe.customers.retrieve(customerId);
  const email = (customer as any).email;

  console.log('Email trouvé:', email);

  // Trouver l'utilisateur
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.log('ERREUR: Utilisateur non trouvé');
    console.log('Utilisateurs disponibles:', users.map(u => u.email));
    return;
  }

  console.log('User ID:', user.id);

  // Récupérer subscription
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const planTier = session.metadata?.plan_tier || 'starter';
  const billingCycle = session.metadata?.billing_cycle || 'monthly';
  const creditsLimit = 500; // Starter monthly

  console.log('Activation:', planTier, billingCycle, creditsLimit, 'pages');

  // Mettre à jour
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: 'active',
      plan_tier: planTier,
      billing_cycle: billingCycle,
      credits_monthly_limit: creditsLimit,
      credits_used_this_month: 0,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('ERREUR:', error);
    return;
  }

  console.log('✅ ABONNEMENT ACTIVÉ !');
}

activate();
