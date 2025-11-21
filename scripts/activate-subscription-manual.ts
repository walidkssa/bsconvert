/**
 * Manual Subscription Activation Script
 * Use this to manually activate a subscription when webhooks fail
 *
 * Usage:
 *   npx tsx scripts/activate-subscription-manual.ts <email> <plan> <cycle>
 *
 * Example:
 *   npx tsx scripts/activate-subscription-manual.ts user@example.com professional monthly
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { getPlanLimit } from '../lib/stripe-config';
import type { PlanTier, BillingCycle } from '../lib/stripe-config';

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Supabase credentials not found in environment variables');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function activateSubscription(email: string, planTier: PlanTier, billingCycle: BillingCycle) {
  console.log('🚀 Starting manual subscription activation...\n');
  console.log(`📧 Email: ${email}`);
  console.log(`📦 Plan: ${planTier}`);
  console.log(`🔄 Billing Cycle: ${billingCycle}\n`);

  try {
    // 1. Find user by email
    console.log('🔍 Looking up user...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      console.error('❌ User not found with email:', email);
      console.error('Error:', profileError);
      process.exit(1);
    }

    console.log(`✅ User found: ${profile.id}\n`);

    // 2. Get Stripe customer
    let customerId = profile.stripe_customer_id;

    if (!customerId) {
      console.log('🔧 Creating Stripe customer...');
      const customer = await stripe.customers.create({
        email: email,
        metadata: {
          supabase_user_id: profile.id,
        },
      });
      customerId = customer.id;
      console.log(`✅ Stripe customer created: ${customerId}\n`);
    } else {
      console.log(`✅ Stripe customer exists: ${customerId}\n`);
    }

    // 3. Find or create Stripe subscription
    console.log('🔍 Looking for existing subscriptions...');
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
    });

    console.log(`Found ${existingSubscriptions.data.length} subscription(s)\n`);

    let subscription: Stripe.Subscription | null = null;

    // Check if there's an active or trialing subscription
    const activeSubscription = existingSubscriptions.data.find(
      sub => sub.status === 'active' || sub.status === 'trialing'
    );

    if (activeSubscription) {
      console.log('✅ Found active subscription:', activeSubscription.id);
      subscription = activeSubscription;
    } else {
      // Find the most recent subscription (even if canceled/incomplete)
      const latestSubscription = existingSubscriptions.data[0];
      if (latestSubscription) {
        console.log('⚠️  Found recent subscription (not active):', latestSubscription.id);
        console.log('Status:', latestSubscription.status);
        subscription = latestSubscription;
      }
    }

    if (!subscription) {
      console.log('❌ No subscription found. User needs to complete payment first.');
      process.exit(1);
    }

    // 4. Get plan limits
    const creditsLimit = getPlanLimit(planTier, billingCycle);
    console.log(`\n💳 Credits limit for ${planTier} (${billingCycle}): ${creditsLimit} pages`);

    // 5. Update user profile
    console.log('\n🔧 Updating user profile...');

    // Handle period dates - might be null or invalid
    let periodStart = null;
    let periodEnd = null;

    if (subscription.current_period_start && subscription.current_period_start > 0) {
      periodStart = new Date(subscription.current_period_start * 1000).toISOString();
    }

    if (subscription.current_period_end && subscription.current_period_end > 0) {
      periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
    }

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        subscription_status: 'active',
        plan_tier: planTier,
        billing_cycle: billingCycle,
        credits_monthly_limit: creditsLimit,
        credits_used_this_month: 0,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        current_period_start: periodStart,
        current_period_end: periodEnd,
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('❌ Error updating user profile:', updateError);
      throw updateError;
    }

    console.log('✅ User profile updated');

    // 6. Create or update subscription record
    console.log('🔧 Creating subscription record...');

    // Check if subscription record exists
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (existingSub) {
      console.log('⚠️  Subscription record exists, updating...');
      const { error: subUpdateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          plan_tier: planTier,
          billing_cycle: billingCycle,
          current_period_start: periodStart,
          current_period_end: periodEnd,
        })
        .eq('stripe_subscription_id', subscription.id);

      if (subUpdateError) {
        console.error('❌ Error updating subscription record:', subUpdateError);
      } else {
        console.log('✅ Subscription record updated');
      }
    } else {
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: profile.id,
          plan_tier: planTier,
          billing_cycle: billingCycle,
          amount: (subscription.items.data[0].price.unit_amount || 0) / 100,
          currency: subscription.currency || 'usd',
          status: 'active',
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId,
          stripe_price_id: subscription.items.data[0].price.id,
          current_period_start: periodStart,
          current_period_end: periodEnd,
        });

      if (subError) {
        console.error('❌ Error creating subscription record:', subError);
      } else {
        console.log('✅ Subscription record created');
      }
    }

    // 7. Log credit transaction
    console.log('🔧 Logging credit transaction...');
    await supabase
      .from('credit_transactions')
      .insert({
        user_id: profile.id,
        transaction_type: 'manual_activation',
        amount: creditsLimit,
        description: `Manual activation: ${planTier} plan (${billingCycle})`,
      });

    console.log('✅ Credit transaction logged');

    console.log('\n🎉 SUBSCRIPTION ACTIVATED SUCCESSFULLY!\n');
    console.log('📊 Summary:');
    console.log(`   User ID: ${profile.id}`);
    console.log(`   Email: ${email}`);
    console.log(`   Plan: ${planTier}`);
    console.log(`   Billing: ${billingCycle}`);
    console.log(`   Credits: ${creditsLimit} pages`);
    console.log(`   Stripe Subscription: ${subscription.id}`);
    console.log(`   Period: ${new Date(subscription.current_period_start * 1000).toLocaleDateString()} - ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error activating subscription:', error);
    throw error;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 3) {
  console.error('Usage: npx tsx scripts/activate-subscription-manual.ts <email> <plan> <cycle>');
  console.error('');
  console.error('Example:');
  console.error('  npx tsx scripts/activate-subscription-manual.ts user@example.com professional monthly');
  console.error('');
  console.error('Plans: starter | professional | enterprise');
  console.error('Cycles: monthly | yearly');
  process.exit(1);
}

const [email, planTier, billingCycle] = args;

// Validate plan tier
if (!['starter', 'professional', 'enterprise'].includes(planTier)) {
  console.error('❌ Invalid plan tier. Must be: starter, professional, or enterprise');
  process.exit(1);
}

// Validate billing cycle
if (!['monthly', 'yearly'].includes(billingCycle)) {
  console.error('❌ Invalid billing cycle. Must be: monthly or yearly');
  process.exit(1);
}

// Run the activation
activateSubscription(email, planTier as PlanTier, billingCycle as BillingCycle)
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to activate subscription');
    process.exit(1);
  });
