import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function fixUpgradeManually() {
  console.log('🔧 CORRECTION MANUELLE DE L\'UPGRADE\n');
  console.log('=' .repeat(80));

  const userId = '6af7be1e-6843-4ec7-932f-41e68d4146a2';

  try {
    // 1. Récupérer le profil actuel
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('\n📋 ÉTAT ACTUEL:');
    console.log(`   Plan: ${profile?.plan_tier}`);
    console.log(`   Crédits: ${profile?.credits_used_this_month}/${profile?.credits_monthly_limit}`);
    console.log(`   Stripe Sub ID: ${profile?.stripe_subscription_id}`);

    // 2. Récupérer la subscription Stripe pour voir le VRAI plan
    if (profile?.stripe_subscription_id) {
      console.log('\n🔍 VÉRIFICATION STRIPE:');

      const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);

      console.log(`   Status: ${subscription.status}`);
      console.log(`   Price ID: ${subscription.items.data[0].price.id}`);
      console.log(`   Amount: ${subscription.items.data[0].price.unit_amount! / 100} ${subscription.currency}`);
      console.log(`   Metadata:`, subscription.metadata);

      // Déterminer le plan basé sur le price
      const priceId = subscription.items.data[0].price.id;
      let planTier: string;
      let billingCycle: string;
      let creditsLimit: number;

      // Mapping des price IDs selon la config Stripe
      const amount = subscription.items.data[0].price.unit_amount!;

      if (amount === 1999) {
        planTier = 'starter';
        billingCycle = 'monthly';
        creditsLimit = 500;
      } else if (amount === 18000) {
        planTier = 'starter';
        billingCycle = 'yearly';
        creditsLimit = 6000;
      } else if (amount === 4999) {
        planTier = 'professional';
        billingCycle = 'monthly';
        creditsLimit = 1500;
      } else if (amount === 39000) {
        planTier = 'professional';
        billingCycle = 'yearly';
        creditsLimit = 18000;
      } else if (amount === 9999) {
        planTier = 'enterprise';
        billingCycle = 'monthly';
        creditsLimit = 10000;
      } else if (amount === 89000) {
        planTier = 'enterprise';
        billingCycle = 'yearly';
        creditsLimit = 120000;
      } else {
        console.log('\n⚠️  Impossible de déterminer le plan automatiquement');
        console.log('   Montant:', amount);
        return;
      }

      console.log(`\n✅ PLAN DÉTECTÉ: ${planTier} (${billingCycle})`);
      console.log(`   Crédits: ${creditsLimit}`);

      // 3. Mettre à jour le profil
      console.log('\n🔄 MISE À JOUR DU PROFIL:');

      const updateData: any = {
        plan_tier: planTier,
        billing_cycle: billingCycle,
        credits_monthly_limit: creditsLimit,
        credits_used_this_month: 0, // RESET complet
        subscription_status: 'active',
      };

      // Ajouter les dates seulement si elles sont valides
      if (subscription.current_period_start) {
        updateData.current_period_start = new Date(subscription.current_period_start * 1000).toISOString();
      }
      if (subscription.current_period_end) {
        updateData.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
      }

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Erreur:', updateError);
        return;
      }

      console.log('   ✅ Profil mis à jour');

      // 4. Logger la transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'plan_upgrade',
          amount: creditsLimit,
          description: `Manual fix: Upgraded to ${planTier} plan - credits reset`,
        });

      console.log('   ✅ Transaction loggée');

      // 5. Créer l'entrée subscription si elle n'existe pas
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (!existingSub) {
        const subData: any = {
          user_id: userId,
          plan_tier: planTier,
          billing_cycle: billingCycle,
          amount: subscription.items.data[0].price.unit_amount! / 100,
          currency: subscription.currency,
          status: 'active',
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          stripe_price_id: priceId,
        };

        if (subscription.current_period_start) {
          subData.current_period_start = new Date(subscription.current_period_start * 1000).toISOString();
        }
        if (subscription.current_period_end) {
          subData.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
        }

        await supabase
          .from('subscriptions')
          .insert(subData);

        console.log('   ✅ Enregistrement subscription créé');
      }

      // 6. Vérification finale
      console.log('\n✅ VÉRIFICATION FINALE:');
      const { data: updatedProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log(`   Plan: ${updatedProfile?.plan_tier}`);
      console.log(`   Crédits: ${updatedProfile?.credits_used_this_month}/${updatedProfile?.credits_monthly_limit}`);
      console.log(`   Restants: ${updatedProfile?.credits_monthly_limit! - updatedProfile?.credits_used_this_month!}`);

      console.log('\n🎉 CORRECTION TERMINÉE AVEC SUCCÈS!\n');
    }

  } catch (error) {
    console.error('❌ ERREUR:', error);
  }
}

fixUpgradeManually().catch(console.error);
