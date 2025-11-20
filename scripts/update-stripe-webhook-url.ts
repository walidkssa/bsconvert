import Stripe from 'stripe';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function updateWebhookUrl() {
  console.log('🔧 MISE À JOUR DE L\'URL DU WEBHOOK STRIPE\n');
  console.log('=' .repeat(80));

  const newUrl = 'https://bsconvert.com/api/webhooks/stripe';

  try {
    // Lister tous les webhooks
    const endpoints = await stripe.webhookEndpoints.list({ limit: 10 });

    if (endpoints.data.length === 0) {
      console.log('❌ Aucun webhook existant');
      console.log('\n🔧 Création d\'un nouveau webhook...\n');

      const newEndpoint = await stripe.webhookEndpoints.create({
        url: newUrl,
        enabled_events: [
          'checkout.session.completed',
          'customer.subscription.created',
          'customer.subscription.updated',
          'customer.subscription.deleted',
          'invoice.payment_succeeded',
          'invoice.payment_failed',
        ],
      });

      console.log('✅ Webhook créé!');
      console.log(`   URL: ${newEndpoint.url}`);
      console.log(`   ID: ${newEndpoint.id}`);
      console.log(`\n🔑 IMPORTANT: Copiez ce Signing Secret dans .env.local:`);
      console.log(`   STRIPE_WEBHOOK_SECRET=${newEndpoint.secret}`);
      return;
    }

    console.log(`📋 ${endpoints.data.length} webhook(s) existant(s):\n`);

    // Chercher un webhook pour promptopal.com
    const promptopalWebhook = endpoints.data.find(e => e.url.includes('promptopal.com'));

    if (promptopalWebhook) {
      console.log(`🔄 Mise à jour du webhook: ${promptopalWebhook.id}`);
      console.log(`   Ancien URL: ${promptopalWebhook.url}`);
      console.log(`   Nouvel URL: ${newUrl}\n`);

      const updated = await stripe.webhookEndpoints.update(promptopalWebhook.id, {
        url: newUrl,
      });

      console.log('✅ Webhook mis à jour!');
      console.log(`   Nouvel URL: ${updated.url}`);
      console.log(`   Status: ${updated.status}`);
      console.log(`\n🔑 Le Signing Secret reste le même dans .env.local`);
    } else {
      console.log('⚠️  Aucun webhook promptopal.com trouvé');
      console.log('\n🔧 Création d\'un nouveau webhook pour bsconvert.com...\n');

      const newEndpoint = await stripe.webhookEndpoints.create({
        url: newUrl,
        enabled_events: [
          'checkout.session.completed',
          'customer.subscription.created',
          'customer.subscription.updated',
          'customer.subscription.deleted',
          'invoice.payment_succeeded',
          'invoice.payment_failed',
        ],
      });

      console.log('✅ Webhook créé!');
      console.log(`   URL: ${newEndpoint.url}`);
      console.log(`   ID: ${newEndpoint.id}`);
      console.log(`\n🔑 IMPORTANT: Copiez ce Signing Secret dans .env.local:`);
      console.log(`   STRIPE_WEBHOOK_SECRET=${newEndpoint.secret}`);
    }

  } catch (error) {
    console.error('❌ ERREUR:', error);
  }
}

updateWebhookUrl().catch(console.error);
