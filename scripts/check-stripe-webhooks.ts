import Stripe from 'stripe';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function checkWebhooks() {
  console.log('🔍 VÉRIFICATION DES WEBHOOKS STRIPE\n');
  console.log('=' .repeat(80));

  try {
    // Lister tous les webhooks configurés
    const endpoints = await stripe.webhookEndpoints.list({ limit: 10 });

    if (endpoints.data.length === 0) {
      console.log('❌ AUCUN WEBHOOK CONFIGURÉ!\n');
      console.log('🔧 SOLUTION: Vous devez créer un webhook dans Stripe Dashboard');
      console.log('\n📝 ÉTAPES:');
      console.log('   1. Aller sur: https://dashboard.stripe.com/webhooks');
      console.log('   2. Cliquer "Add endpoint"');
      console.log('   3. URL: https://bsconvert.com/api/webhooks/stripe');
      console.log('   4. Événements à sélectionner:');
      console.log('      • checkout.session.completed');
      console.log('      • customer.subscription.created');
      console.log('      • customer.subscription.updated');
      console.log('      • customer.subscription.deleted');
      console.log('      • invoice.payment_succeeded');
      console.log('      • invoice.payment_failed');
      console.log('   5. Copier le "Signing secret" dans .env.local');
      return;
    }

    console.log(`✅ ${endpoints.data.length} webhook(s) trouvé(s):\n`);

    endpoints.data.forEach((endpoint, index) => {
      console.log(`[${index + 1}] ${endpoint.url}`);
      console.log(`    Status: ${endpoint.status}`);
      console.log(`    ID: ${endpoint.id}`);
      console.log(`    Événements écoutés (${endpoint.enabled_events.length}):`);

      const requiredEvents = [
        'checkout.session.completed',
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
      ];

      requiredEvents.forEach(event => {
        const isEnabled = endpoint.enabled_events.includes(event);
        console.log(`      ${isEnabled ? '✅' : '❌'} ${event}`);
      });

      const allEventsEnabled = requiredEvents.every(e => endpoint.enabled_events.includes(e));

      if (!allEventsEnabled) {
        console.log('\n    ⚠️  ATTENTION: Des événements requis sont manquants!');
      } else {
        console.log('\n    ✅ Tous les événements requis sont configurés');
      }

      console.log('');
    });

    // Vérifier le webhook secret
    console.log('=' .repeat(80));
    console.log('\n🔑 WEBHOOK SECRET:');

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.log('❌ STRIPE_WEBHOOK_SECRET non configuré dans .env.local');
    } else if (webhookSecret.startsWith('whsec_')) {
      console.log('✅ Format correct (commence par whsec_)');
      console.log(`   Valeur: ${webhookSecret.substring(0, 15)}...`);
    } else {
      console.log('⚠️  Format suspect (devrait commencer par whsec_)');
      console.log(`   Valeur: ${webhookSecret.substring(0, 15)}...`);
    }

  } catch (error) {
    console.error('❌ ERREUR:', error);
  }
}

checkWebhooks().catch(console.error);
