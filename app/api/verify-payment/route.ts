// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase-server';
import { getPlanLimit } from '@/lib/stripe-config';
import type { PlanTier, BillingCycle } from '@/lib/stripe-config';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed', paid: false },
        { status: 400 }
      );
    }

    // Récupérer les métadonnées
    const planTier = session.metadata?.plan_tier as PlanTier;
    const billingCycle = session.metadata?.billing_cycle as BillingCycle;
    const subscriptionId = session.subscription as string;

    if (!planTier || !billingCycle || !subscriptionId) {
      return NextResponse.json(
        { error: 'Invalid session metadata' },
        { status: 400 }
      );
    }

    // Récupérer les détails de l'abonnement
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const creditsLimit = getPlanLimit(planTier, billingCycle);

    // Mettre à jour le profil utilisateur
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
      console.error('Error updating user profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Créer l'entrée dans subscriptions
    await supabase
      .from('subscriptions')
      .upsert({
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
      }, {
        onConflict: 'stripe_subscription_id'
      });

    // Logger la transaction de crédit
    await supabase
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        transaction_type: 'monthly_reset',
        amount: creditsLimit,
        description: `Subscription activated: ${planTier} plan (${billingCycle})`,
      });

    console.log(`✅ User ${user.id} subscription verified and activated: ${planTier} (${billingCycle})`);

    return NextResponse.json({
      success: true,
      subscription: {
        plan_tier: planTier,
        billing_cycle: billingCycle,
        credits: creditsLimit,
        status: 'active',
      },
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
