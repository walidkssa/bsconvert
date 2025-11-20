// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function diagnose() {
  console.log('🔍 DIAGNOSTIC DU SYSTÈME DE CRÉDITS\n');
  console.log('=' .repeat(60));

  // 1. Vérifier la structure de la table user_profiles
  console.log('\n📊 1. STRUCTURE DE LA TABLE user_profiles');
  console.log('-'.repeat(60));

  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(5);

  if (profilesError) {
    console.error('❌ Erreur lors de la récupération des profils:', profilesError);
  } else {
    console.log(`✅ ${profiles?.length || 0} profil(s) trouvé(s)`);
    if (profiles && profiles.length > 0) {
      console.log('\nColonnes disponibles:', Object.keys(profiles[0]));
      console.log('\nPremier profil:');
      console.log(JSON.stringify(profiles[0], null, 2));
    }
  }

  // 2. Vérifier les colonnes spécifiques
  console.log('\n💳 2. VÉRIFICATION DES COLONNES DE CRÉDITS');
  console.log('-'.repeat(60));

  const { data: creditCheck } = await supabase
    .from('user_profiles')
    .select('id, email, credits_monthly_limit, credits_used_this_month, subscription_status, plan_tier')
    .limit(5);

  if (creditCheck) {
    creditCheck.forEach(profile => {
      const remaining = (profile.credits_monthly_limit || 0) - (profile.credits_used_this_month || 0);
      console.log(`\nUser: ${profile.email}`);
      console.log(`  Status: ${profile.subscription_status}`);
      console.log(`  Plan: ${profile.plan_tier}`);
      console.log(`  Limit: ${profile.credits_monthly_limit}`);
      console.log(`  Used: ${profile.credits_used_this_month}`);
      console.log(`  Remaining: ${remaining}`);
    });
  }

  // 3. Vérifier la table usage_tracking
  console.log('\n📈 3. HISTORIQUE D\'UTILISATION (usage_tracking)');
  console.log('-'.repeat(60));

  const { data: usageData, error: usageError } = await supabase
    .from('usage_tracking')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (usageError) {
    console.error('❌ Erreur:', usageError);
  } else {
    console.log(`✅ ${usageData?.length || 0} entrée(s) d'utilisation trouvée(s)`);
    if (usageData && usageData.length > 0) {
      usageData.forEach(usage => {
        console.log(`\n  - ${usage.file_name || 'N/A'}`);
        console.log(`    Pages: ${usage.pages_processed}, Crédits: ${usage.credits_deducted}`);
        console.log(`    Date: ${new Date(usage.created_at).toLocaleString()}`);
      });
    } else {
      console.log('⚠️  Aucune utilisation enregistrée');
    }
  }

  // 4. Vérifier la table credit_transactions
  console.log('\n💰 4. TRANSACTIONS DE CRÉDITS (credit_transactions)');
  console.log('-'.repeat(60));

  const { data: transactions, error: txError } = await supabase
    .from('credit_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (txError) {
    console.error('❌ Erreur:', txError);
  } else {
    console.log(`✅ ${transactions?.length || 0} transaction(s) trouvée(s)`);
    if (transactions && transactions.length > 0) {
      transactions.forEach(tx => {
        console.log(`\n  - ${tx.transaction_type}`);
        console.log(`    Montant: ${tx.amount}`);
        console.log(`    Description: ${tx.description}`);
        console.log(`    Date: ${new Date(tx.created_at).toLocaleString()}`);
      });
    } else {
      console.log('⚠️  Aucune transaction enregistrée');
    }
  }

  // 5. Vérifier la table conversions
  console.log('\n📄 5. CONVERSIONS RÉCENTES');
  console.log('-'.repeat(60));

  const { data: conversions, error: convError } = await supabase
    .from('conversions')
    .select('id, filename, status, pages_count, credits_used, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(10);

  if (convError) {
    console.error('❌ Erreur:', convError);
  } else {
    console.log(`✅ ${conversions?.length || 0} conversion(s) trouvée(s)`);
    if (conversions && conversions.length > 0) {
      conversions.forEach(conv => {
        console.log(`\n  - ${conv.filename}`);
        console.log(`    Status: ${conv.status}`);
        console.log(`    Pages: ${conv.pages_count || 'N/A'}`);
        console.log(`    Credits: ${conv.credits_used || 'N/A'}`);
        console.log(`    User ID: ${conv.user_id || 'N/A'}`);
        console.log(`    Date: ${new Date(conv.created_at).toLocaleString()}`);
      });
    } else {
      console.log('⚠️  Aucune conversion trouvée');
    }
  }

  // 6. Vérifier les policies RLS
  console.log('\n🔒 6. ROW LEVEL SECURITY (RLS)');
  console.log('-'.repeat(60));

  const { data: rlsCheck } = await supabase.rpc('get_my_claims' as any).catch(() => ({ data: null }));
  console.log('Note: Pour vérifier les policies RLS, utilisez l\'interface Supabase');

  // 7. Test de mise à jour
  console.log('\n🧪 7. TEST DE MISE À JOUR');
  console.log('-'.repeat(60));

  const { data: testProfile } = await supabase
    .from('user_profiles')
    .select('id, email, credits_used_this_month')
    .eq('subscription_status', 'active')
    .limit(1)
    .single();

  if (testProfile) {
    console.log(`Test sur le profil: ${testProfile.email}`);
    console.log(`Crédits utilisés actuellement: ${testProfile.credits_used_this_month}`);

    // Test d'incrémentation
    const newValue = (testProfile.credits_used_this_month || 0) + 1;
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ credits_used_this_month: newValue })
      .eq('id', testProfile.id);

    if (updateError) {
      console.error('❌ Échec de la mise à jour:', updateError);
      console.log('Détails de l\'erreur:', JSON.stringify(updateError, null, 2));
    } else {
      console.log('✅ Mise à jour réussie!');

      // Vérifier la nouvelle valeur
      const { data: verifyProfile } = await supabase
        .from('user_profiles')
        .select('credits_used_this_month')
        .eq('id', testProfile.id)
        .single();

      console.log(`Nouvelle valeur: ${verifyProfile?.credits_used_this_month}`);

      // Restaurer l'ancienne valeur
      await supabase
        .from('user_profiles')
        .update({ credits_used_this_month: testProfile.credits_used_this_month })
        .eq('id', testProfile.id);
      console.log('✅ Valeur restaurée');
    }
  } else {
    console.log('⚠️  Aucun profil actif trouvé pour le test');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ DIAGNOSTIC TERMINÉ\n');
}

diagnose().catch(console.error);
