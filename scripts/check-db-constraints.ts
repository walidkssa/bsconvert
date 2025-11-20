import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkConstraints() {
  console.log('🔍 VÉRIFICATION DES CONTRAINTES DATABASE\n');
  console.log('=' .repeat(80));

  try {
    // Query pour récupérer les contraintes
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT
          conname AS constraint_name,
          pg_get_constraintdef(oid) AS constraint_definition
        FROM pg_constraint
        WHERE conrelid = 'user_profiles'::regclass
        AND contype = 'c';
      `
    });

    if (error) {
      console.error('❌ Erreur:', error);

      // Alternative: essayer de lire la structure de la table
      console.log('\n🔄 Tentative alternative...\n');

      const { data: tableInfo } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1);

      console.log('Structure de user_profiles:', tableInfo);
    } else {
      console.log('✅ Contraintes trouvées:');
      console.log(data);
    }

  } catch (error) {
    console.error('❌ ERREUR:', error);
  }
}

checkConstraints().catch(console.error);
