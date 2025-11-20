import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function restoreCredits() {
  console.log('🔄 RESTORATION DES CRÉDITS\n');
  console.log('=' .repeat(60));

  const userId = '6af7be1e-6843-4ec7-932f-41e68d4146a2'; // Votre user ID

  try {
    // 1. Récupérer la dernière conversion
    console.log('\n1️⃣ Recherche de la dernière conversion...');

    const { data: lastConversion, error: convError } = await supabase
      .from('conversions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (convError || !lastConversion) {
      console.error('❌ Erreur:', convError);
      return;
    }

    console.log(`   ✅ Conversion trouvée: ${lastConversion.filename}`);
    console.log(`   ID: ${lastConversion.id}`);
    console.log(`   Pages comptées: ${lastConversion.pages_count}`);
    console.log(`   Crédits enregistrés: ${lastConversion.credits_used}`);

    // 2. Obtenir le vrai nombre de pages du fichier PDF
    // Pour l'instant, nous savons que 1 crédit a été déduit mais le PDF a plus de pages
    // Vérifions combien de crédits ont été utilisés
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('credits_monthly_limit, credits_used_this_month')
      .eq('id', userId)
      .single();

    console.log('\n2️⃣ État actuel des crédits:');
    console.log(`   Limite: ${currentProfile?.credits_monthly_limit}`);
    console.log(`   Utilisés: ${currentProfile?.credits_used_this_month}`);
    console.log(`   Restants: ${(currentProfile?.credits_monthly_limit || 0) - (currentProfile?.credits_used_this_month || 0)}`);

    // 3. Restaurer le crédit déduit (car le comptage était faux)
    console.log('\n3️⃣ Restauration du crédit déduit incorrectement...');

    const creditsToRestore = 1; // On a déduit 1 crédit au lieu du vrai nombre
    const newCreditsUsed = Math.max(0, (currentProfile?.credits_used_this_month || 0) - creditsToRestore);

    const { error: restoreError } = await supabase
      .from('user_profiles')
      .update({
        credits_used_this_month: newCreditsUsed
      })
      .eq('id', userId);

    if (restoreError) {
      console.error('   ❌ Erreur:', restoreError);
      return;
    }

    console.log(`   ✅ ${creditsToRestore} crédit(s) restauré(s)!`);

    // 4. Vérifier l'état final
    const { data: finalProfile } = await supabase
      .from('user_profiles')
      .select('credits_monthly_limit, credits_used_this_month')
      .eq('id', userId)
      .single();

    console.log('\n4️⃣ État final des crédits:');
    console.log(`   Limite: ${finalProfile?.credits_monthly_limit}`);
    console.log(`   Utilisés: ${finalProfile?.credits_used_this_month}`);
    console.log(`   Restants: ${(finalProfile?.credits_monthly_limit || 0) - (finalProfile?.credits_used_this_month || 0)}`);

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Crédits restaurés avec succès!');
    console.log('\n💡 Note: La prochaine conversion déduira le bon nombre de crédits');
    console.log('   car le bug du comptage de pages a été corrigé.\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

restoreCredits().catch(console.error);
