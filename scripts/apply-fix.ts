import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function applyFix() {
  console.log('🔧 APPLICATION DU FIX POUR LA TABLE CONVERSIONS\n');
  console.log('=' .repeat(60));

  try {
    console.log('\n1️⃣ Vérification de la structure actuelle...');

    // Essayer de récupérer une conversion pour voir les colonnes
    const { data: testConv, error: testError } = await supabase
      .from('conversions')
      .select('*')
      .limit(1);

    if (testConv) {
      console.log('   Colonnes actuelles:', Object.keys(testConv[0] || {}));
      if (testConv[0] && !('user_id' in testConv[0])) {
        console.log('   ❌ La colonne user_id est MANQUANTE');
      } else if (testConv[0]) {
        console.log('   ✅ La colonne user_id existe déjà');
      }
    }

    console.log('\n2️⃣ Application des fixes via l\'API...\n');

    // Malheureusement, Supabase ne permet pas d'exécuter du SQL DDL via l'API JavaScript
    // Nous devons utiliser l'interface SQL Editor ou psql

    console.log('⚠️  IMPORTANT: Les modifications de schéma doivent être faites via:');
    console.log('');
    console.log('   Option 1: Interface Supabase');
    console.log('   --------------------------');
    console.log('   1. Allez sur: https://supabase.com/dashboard/project/silulzqcbmhypwpyggmo');
    console.log('   2. Cliquez sur "SQL Editor" dans le menu de gauche');
    console.log('   3. Créez une nouvelle requête');
    console.log('   4. Collez le SQL ci-dessous:');
    console.log('');
    console.log('   ```sql');
    console.log('   ALTER TABLE conversions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;');
    console.log('   CREATE INDEX IF NOT EXISTS conversions_user_id_idx ON conversions(user_id);');
    console.log('   ALTER TABLE conversions ADD COLUMN IF NOT EXISTS pages_count INT DEFAULT 1;');
    console.log('   ALTER TABLE conversions ADD COLUMN IF NOT EXISTS credits_used INT DEFAULT 0;');
    console.log('   ALTER TABLE conversions ADD COLUMN IF NOT EXISTS is_free_trial BOOLEAN DEFAULT FALSE;');
    console.log('   ```');
    console.log('');
    console.log('   5. Cliquez sur "RUN" (Ctrl+Enter)');
    console.log('');
    console.log('   Option 2: CLI psql (Plus rapide)');
    console.log('   --------------------------');
    console.log('   Exécutez cette commande:');
    console.log('');
    console.log('   psql "postgresql://postgres.silulzqcbmhypwpyggmo:[VOTRE_MOT_DE_PASSE]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" \\');
    console.log('        -c "ALTER TABLE conversions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE; \\');
    console.log('            CREATE INDEX IF NOT EXISTS conversions_user_id_idx ON conversions(user_id); \\');
    console.log('            ALTER TABLE conversions ADD COLUMN IF NOT EXISTS pages_count INT DEFAULT 1; \\');
    console.log('            ALTER TABLE conversions ADD COLUMN IF NOT EXISTS credits_used INT DEFAULT 0; \\');
    console.log('            ALTER TABLE conversions ADD COLUMN IF NOT EXISTS is_free_trial BOOLEAN DEFAULT FALSE;"');
    console.log('');
    console.log('   Note: Le mot de passe de la base de données se trouve dans:');
    console.log('         Supabase Dashboard > Settings > Database > Connection string');
    console.log('');

    console.log('\n3️⃣ Après avoir exécuté le SQL, relancez le diagnostic:');
    console.log('');
    console.log('   npm run tsx scripts/diagnose-credits.ts');
    console.log('');

    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

applyFix().catch(console.error);
