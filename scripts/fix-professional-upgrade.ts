// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function fixProfessionalUpgrade() {
  console.log('🔧 MISE À JOUR VERS PROFESSIONAL YEARLY\n');
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

    // 2. Récupérer la subscription Stripe
    if (profile?.stripe_subscription_id) {
      console.log('\n🔍 VÉRIFICATION STRIPE:');

      const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);

      console.log(`   Status: ${subscription.status}`);
      console.log(`   Price ID: ${subscription.items.data[0].price.id}`);
      console.log(`   Amount: ${subscription.items.data[0].price.unit_amount! / 100} ${subscription.currency}`);

      const amount = subscription.items.data[0].price.unit_amount!;

      // Vérifier si c'est Professional Yearly ($390 = 39000¢)
      if (amount === 39000) {
        console.log('\n✅ PLAN DÉTECTÉ: Professional Yearly');
        console.log('   Crédits: 18,000 pages/an');

        // 3. Mettre à jour le profil
        console.log('\n🔄 MISE À JOUR DU PROFIL:');

        const updateData: any = {
          plan_tier: 'professional',
          billing_cycle: 'yearly',
          credits_monthly_limit: 18000,
          credits_used_this_month: 0, // RESET complet
          subscription_status: 'active',
        };

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
            amount: 18000,
            description: 'Upgraded to Professional Yearly - credits reset',
          });

        console.log('   ✅ Transaction loggée');

        // 5. Créer/mettre à jour l'entrée subscription
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (!existingSub) {
          const subData: any = {
            user_id: userId,
            plan_tier: 'professional',
            billing_cycle: 'yearly',
            amount: 390,
            currency: subscription.currency,
            status: 'active',
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            stripe_price_id: subscription.items.data[0].price.id,
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
        } else {
          console.log('   ℹ️  Subscription existe déjà');
        }

        // 6. Vérification finale
        console.log('\n✅ VÉRIFICATION FINALE:');
        const { data: updatedProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        console.log(`   Plan: ${updatedProfile?.plan_tier}`);
        console.log(`   Cycle: ${updatedProfile?.billing_cycle}`);
        console.log(`   Crédits: ${updatedProfile?.credits_used_this_month}/${updatedProfile?.credits_monthly_limit}`);
        console.log(`   Restants: ${updatedProfile?.credits_monthly_limit! - updatedProfile?.credits_used_this_month!} pages`);

        console.log('\n🎉 UPGRADE VERS PROFESSIONAL YEARLY RÉUSSI!\n');

      } else {
        console.log(`\n⚠️  Montant inattendu: ${amount}¢`);
        console.log('   Professional Yearly devrait être 39000¢ ($390)');
        console.log('\n💡 Vérifiez que vous avez bien souscrit au plan Professional Yearly dans Stripe');
      }
    }

  } catch (error) {
    console.error('❌ ERREUR:', error);
  }
}

fixProfessionalUpgrade().catch(console.error);
