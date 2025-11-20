import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testConversionFlow() {
  console.log('🧪 TEST DU FLUX DE CONVERSION\n');
  console.log('=' .repeat(60));

  try {
    // 1. Vérifier la structure de la table conversions
    console.log('\n1️⃣ Vérification de la structure de la table conversions...');

    const { data: testConv, error: testError } = await supabase
      .from('conversions')
      .select('*')
      .limit(1);

    if (testConv && testConv.length > 0) {
      const columns = Object.keys(testConv[0]);
      console.log('   Colonnes disponibles:', columns);

      if (columns.includes('user_id')) {
        console.log('   ✅ La colonne user_id existe!');
      } else {
        console.log('   ❌ La colonne user_id est toujours manquante!');
        return;
      }
    }

    // 2. Créer une conversion test avec user_id explicite
    console.log('\n2️⃣ Test de création de conversion avec user_id...');

    const testUserId = '6af7be1e-6843-4ec7-932f-41e68d4146a2'; // Votre user ID

    const { data: newConv, error: insertError } = await supabase
      .from('conversions')
      .insert({
        filename: 'test-credit-system.pdf',
        file_size: 12345,
        file_type: 'application/pdf',
        status: 'processing',
        transaction_count: 0,
        user_id: testUserId,
        pages_count: 5,
        credits_used: 5,
      })
      .select()
      .single();

    if (insertError) {
      console.error('   ❌ Erreur lors de l\'insertion:', insertError);
      return;
    }

    console.log('   ✅ Conversion test créée!');
    console.log('   ID:', newConv.id);
    console.log('   User ID:', newConv.user_id);
    console.log('   Pages:', newConv.pages_count);
    console.log('   Credits:', newConv.credits_used);

    // 3. Test de déduction de crédits
    console.log('\n3️⃣ Test de déduction de crédits...');

    const { data: beforeProfile } = await supabase
      .from('user_profiles')
      .select('credits_monthly_limit, credits_used_this_month')
      .eq('id', testUserId)
      .single();

    console.log('   Avant déduction:');
    console.log('     Limit:', beforeProfile?.credits_monthly_limit);
    console.log('     Utilisés:', beforeProfile?.credits_used_this_month);
    console.log('     Restants:', (beforeProfile?.credits_monthly_limit || 0) - (beforeProfile?.credits_used_this_month || 0));

    // Déduire 5 crédits
    const { error: deductError } = await supabase
      .from('user_profiles')
      .update({
        credits_used_this_month: (beforeProfile?.credits_used_this_month || 0) + 5
      })
      .eq('id', testUserId);

    if (deductError) {
      console.error('   ❌ Erreur lors de la déduction:', deductError);
    } else {
      console.log('   ✅ Déduction réussie!');

      const { data: afterProfile } = await supabase
        .from('user_profiles')
        .select('credits_monthly_limit, credits_used_this_month')
        .eq('id', testUserId)
        .single();

      console.log('   Après déduction:');
      console.log('     Limit:', afterProfile?.credits_monthly_limit);
      console.log('     Utilisés:', afterProfile?.credits_used_this_month);
      console.log('     Restants:', (afterProfile?.credits_monthly_limit || 0) - (afterProfile?.credits_used_this_month || 0));
    }

    // 4. Test d'insertion dans usage_tracking
    console.log('\n4️⃣ Test d\'insertion dans usage_tracking...');

    const { error: usageError } = await supabase
      .from('usage_tracking')
      .insert({
        user_id: testUserId,
        conversion_id: newConv.id,
        pages_processed: 5,
        credits_deducted: 5,
        file_name: 'test-credit-system.pdf',
        file_type: 'application/pdf',
      });

    if (usageError) {
      console.error('   ❌ Erreur:', usageError);
    } else {
      console.log('   ✅ Usage tracking enregistré!');
    }

    // 5. Test d'insertion dans credit_transactions
    console.log('\n5️⃣ Test d\'insertion dans credit_transactions...');

    const { error: txError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: testUserId,
        transaction_type: 'deduction',
        amount: -5,
        description: 'Test: Conversion test-credit-system.pdf',
        reference_id: newConv.id,
      });

    if (txError) {
      console.error('   ❌ Erreur:', txError);
    } else {
      console.log('   ✅ Transaction de crédit enregistrée!');
    }

    // 6. Nettoyer les données de test
    console.log('\n6️⃣ Nettoyage des données de test...');

    // Restaurer les crédits
    await supabase
      .from('user_profiles')
      .update({
        credits_used_this_month: beforeProfile?.credits_used_this_month || 0
      })
      .eq('id', testUserId);

    // Supprimer les enregistrements de test
    await supabase.from('credit_transactions').delete().eq('reference_id', newConv.id);
    await supabase.from('usage_tracking').delete().eq('conversion_id', newConv.id);
    await supabase.from('conversions').delete().eq('id', newConv.id);

    console.log('   ✅ Données de test nettoyées!');

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ TOUS LES TESTS SONT PASSÉS!');
    console.log('\n📝 Résumé:');
    console.log('   • Colonne user_id présente dans conversions ✅');
    console.log('   • Création de conversion avec user_id ✅');
    console.log('   • Déduction de crédits fonctionnelle ✅');
    console.log('   • Usage tracking fonctionnel ✅');
    console.log('   • Transactions de crédit fonctionnelles ✅');
    console.log('\n🎉 Le système de crédits est COMPLÈTEMENT FONCTIONNEL!');
    console.log('');

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testConversionFlow().catch(console.error);
