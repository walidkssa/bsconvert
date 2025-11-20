/**
 * Setup Stripe Products & Prices
 * Run this script once to create all products and prices in Stripe
 *
 * Usage:
 *   npx tsx scripts/setup-stripe-products.ts
 *
 * Make sure to set STRIPE_SECRET_KEY in your .env.local file
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
  console.error('Please add it to your .env.local file');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

async function setupStripeProducts() {
  console.log('🚀 Setting up Stripe products and prices...\n');

  try {
    // ========================================
    // STARTER PLAN
    // ========================================
    console.log('📦 Creating Starter Plan...');
    const starterProduct = await stripe.products.create({
      name: 'BS Convert - Starter',
      description: 'Perfect for small businesses and freelancers',
      metadata: {
        plan_tier: 'starter',
      },
    });

    const starterMonthly = await stripe.prices.create({
      product: starterProduct.id,
      unit_amount: 1999, // $19.99
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: {
        plan_tier: 'starter',
        billing_cycle: 'monthly',
        pages_limit: '500',
      },
    });

    const starterYearly = await stripe.prices.create({
      product: starterProduct.id,
      unit_amount: 18000, // $180
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: {
        plan_tier: 'starter',
        billing_cycle: 'yearly',
        pages_limit: '6000',
      },
    });

    console.log('✅ Starter Plan created');
    console.log(`   Product ID: ${starterProduct.id}`);
    console.log(`   Monthly Price ID: ${starterMonthly.id}`);
    console.log(`   Yearly Price ID: ${starterYearly.id}\n`);

    // ========================================
    // PROFESSIONAL PLAN
    // ========================================
    console.log('📦 Creating Professional Plan...');
    const proProduct = await stripe.products.create({
      name: 'BS Convert - Professional',
      description: 'For accounting professionals managing multiple clients',
      metadata: {
        plan_tier: 'professional',
      },
    });

    const proMonthly = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 4999, // $49.99
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: {
        plan_tier: 'professional',
        billing_cycle: 'monthly',
        pages_limit: '1500',
      },
    });

    const proYearly = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 39000, // $390
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: {
        plan_tier: 'professional',
        billing_cycle: 'yearly',
        pages_limit: '18000',
      },
    });

    console.log('✅ Professional Plan created');
    console.log(`   Product ID: ${proProduct.id}`);
    console.log(`   Monthly Price ID: ${proMonthly.id}`);
    console.log(`   Yearly Price ID: ${proYearly.id}\n`);

    // ========================================
    // ENTERPRISE PLAN
    // ========================================
    console.log('📦 Creating Enterprise Plan...');
    const enterpriseProduct = await stripe.products.create({
      name: 'BS Convert - Enterprise',
      description: 'For large organizations with high-volume needs',
      metadata: {
        plan_tier: 'enterprise',
      },
    });

    const enterpriseMonthly = await stripe.prices.create({
      product: enterpriseProduct.id,
      unit_amount: 9999, // $99.99
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: {
        plan_tier: 'enterprise',
        billing_cycle: 'monthly',
        pages_limit: '10000',
      },
    });

    const enterpriseYearly = await stripe.prices.create({
      product: enterpriseProduct.id,
      unit_amount: 89000, // $890
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: {
        plan_tier: 'enterprise',
        billing_cycle: 'yearly',
        pages_limit: '120000',
      },
    });

    console.log('✅ Enterprise Plan created');
    console.log(`   Product ID: ${enterpriseProduct.id}`);
    console.log(`   Monthly Price ID: ${enterpriseMonthly.id}`);
    console.log(`   Yearly Price ID: ${enterpriseYearly.id}\n`);

    // ========================================
    // SUMMARY
    // ========================================
    console.log('🎉 All products and prices created successfully!\n');
    console.log('📋 Copy these Price IDs to your .env.local file:\n');
    console.log('# Stripe Price IDs');
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY=${starterMonthly.id}`);
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_STARTER_YEARLY=${starterYearly.id}`);
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=${proMonthly.id}`);
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=${proYearly.id}`);
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY=${enterpriseMonthly.id}`);
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_YEARLY=${enterpriseYearly.id}`);
    console.log('');

    // Return all IDs for reference
    return {
      starter: {
        product_id: starterProduct.id,
        monthly: starterMonthly.id,
        yearly: starterYearly.id,
      },
      professional: {
        product_id: proProduct.id,
        monthly: proMonthly.id,
        yearly: proYearly.id,
      },
      enterprise: {
        product_id: enterpriseProduct.id,
        monthly: enterpriseMonthly.id,
        yearly: enterpriseYearly.id,
      },
    };
  } catch (error) {
    console.error('❌ Error creating Stripe products:', error);
    throw error;
  }
}

// Run the script
setupStripeProducts()
  .then((ids) => {
    console.log('✅ Setup complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Copy the Price IDs above to your .env.local file');
    console.log('2. Configure your Stripe Customer Portal (https://dashboard.stripe.com/settings/billing/portal)');
    console.log('3. Set up webhooks endpoint in Stripe Dashboard');
    console.log('4. Test with Stripe Test Mode before going live\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to setup Stripe products');
    process.exit(1);
  });
