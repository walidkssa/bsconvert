// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getPlanLimit } from '@/lib/stripe-config';
import type { PlanTier, BillingCycle } from '@/lib/stripe-config';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Créer un client Supabase avec la service role key pour bypasser RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('❌ No Stripe signature found');
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  console.log(`✅ Received webhook: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`ℹ️  Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// ========================================
// HANDLER: Checkout Session Completed
// ========================================
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('🎉 Processing checkout.session.completed');

  const userId = session.metadata?.user_id;
  const planTier = session.metadata?.plan_tier as PlanTier;
  const billingCycle = session.metadata?.billing_cycle as BillingCycle;

  if (!userId || !planTier || !billingCycle) {
    console.error('❌ Missing metadata in checkout session');
    return;
  }

  // Récupérer la subscription Stripe
  const subscriptionId = session.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const creditsLimit = getPlanLimit(planTier, billingCycle);

  // Mettre à jour le profil utilisateur
  const { error: profileError } = await supabaseAdmin
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
    .eq('id', userId);

  if (profileError) {
    console.error('❌ Error updating user profile:', profileError);
    throw profileError;
  }

  // Créer l'entrée dans subscriptions
  const { error: subError } = await supabaseAdmin
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan_tier: planTier,
      billing_cycle: billingCycle,
      amount: (session.amount_total || 0) / 100,
      currency: session.currency || 'usd',
      status: 'active',
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: session.customer as string,
      stripe_price_id: subscription.items.data[0].price.id,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    });

  if (subError) {
    console.error('❌ Error creating subscription record:', subError);
    throw subError;
  }

  // Logger la transaction de crédit (reset initial)
  await supabaseAdmin
    .from('credit_transactions')
    .insert({
      user_id: userId,
      transaction_type: 'monthly_reset',
      amount: creditsLimit,
      description: `Initial credits for ${planTier} plan`,
    });

  console.log(`✅ User ${userId} subscribed to ${planTier} (${billingCycle})`);
}

// ========================================
// HANDLER: Subscription Updated
// ========================================
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log('🔄 Processing subscription update');

  const userId = subscription.metadata?.user_id;
  if (!userId) {
    console.error('❌ No user_id in subscription metadata');
    return;
  }

  const planTier = subscription.metadata?.plan_tier as PlanTier;
  const billingCycle = subscription.metadata?.billing_cycle as BillingCycle;

  if (planTier && billingCycle) {
    const creditsLimit = getPlanLimit(planTier, billingCycle);

    // Récupérer l'ancien plan
    const { data: currentProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('plan_tier, billing_cycle')
      .eq('id', userId)
      .single();

    const isUpgrade = currentProfile && currentProfile.plan_tier !== planTier;

    await supabaseAdmin
      .from('user_profiles')
      .update({
        subscription_status: subscription.status as any,
        plan_tier: planTier,
        billing_cycle: billingCycle,
        credits_monthly_limit: creditsLimit,
        // RESET credits_used si c'est un upgrade ou changement de plan
        credits_used_this_month: isUpgrade ? 0 : undefined,
        stripe_subscription_id: subscription.id,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq('id', userId);

    // Logger la transaction de crédit si upgrade
    if (isUpgrade) {
      await supabaseAdmin
        .from('credit_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'plan_upgrade',
          amount: creditsLimit,
          description: `Upgraded to ${planTier} plan - credits reset`,
        });

      console.log(`✅ Plan upgraded from ${currentProfile.plan_tier} to ${planTier} - credits reset to ${creditsLimit}`);
    }
  }

  console.log(`✅ Subscription updated for user ${userId}`);
}

// ========================================
// HANDLER: Subscription Deleted
// ========================================
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('❌ Processing subscription deletion');

  const userId = subscription.metadata?.user_id;
  if (!userId) {
    console.error('❌ No user_id in subscription metadata');
    return;
  }

  // Désactiver l'abonnement
  await supabaseAdmin
    .from('user_profiles')
    .update({
      subscription_status: 'canceled',
      credits_monthly_limit: 0,
    })
    .eq('id', userId);

  // Mettre à jour l'enregistrement subscription
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  console.log(`✅ Subscription canceled for user ${userId}`);
}

// ========================================
// HANDLER: Invoice Payment Succeeded
// ========================================
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('💰 Processing successful payment');

  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.error('❌ No user_id in subscription metadata');
    return;
  }

  // Si c'est un renouvellement (pas le premier paiement)
  if (invoice.billing_reason === 'subscription_cycle') {
    console.log('🔄 Monthly renewal - resetting credits');

    const planTier = subscription.metadata?.plan_tier as PlanTier;
    const billingCycle = subscription.metadata?.billing_cycle as BillingCycle;

    if (planTier && billingCycle) {
      const creditsLimit = getPlanLimit(planTier, billingCycle);

      // Reset les crédits
      await supabaseAdmin
        .from('user_profiles')
        .update({
          credits_used_this_month: 0,
          subscription_status: 'active',
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        })
        .eq('id', userId);

      // Logger la transaction
      await supabaseAdmin
        .from('credit_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'monthly_reset',
          amount: creditsLimit,
          description: 'Monthly credit reset',
        });

      console.log(`✅ Credits reset for user ${userId}: ${creditsLimit} pages`);
    }
  }
}

// ========================================
// HANDLER: Invoice Payment Failed
// ========================================
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('⚠️  Processing failed payment');

  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.user_id;

  if (!userId) return;

  // Marquer l'abonnement en retard
  await supabaseAdmin
    .from('user_profiles')
    .update({
      subscription_status: 'past_due',
    })
    .eq('id', userId);

  console.log(`⚠️  User ${userId} subscription marked as past_due`);
}
