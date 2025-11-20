import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigration() {
  console.log('🚀 EXÉCUTION DE LA MIGRATION DE LA BASE DE DONNÉES\n');
  console.log('=' .repeat(60));

  try {
    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, 'fix-database.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('\n📝 Migration SQL chargée');
    console.log('-'.repeat(60));

    // Séparer les commandes SQL
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.match(/^\/\*/));

    console.log(`\n🔧 ${commands.length} commande(s) SQL à exécuter\n`);

    // Exécuter chaque commande
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];

      // Skip comments and empty commands
      if (command.trim().startsWith('--') || command.trim().length === 0) {
        continue;
      }

      console.log(`\n[${i + 1}/${commands.length}] Exécution...`);

      try {
        // Pour PostgreSQL, on utilise la méthode rpc avec une fonction qui exécute le SQL
        // Mais Supabase ne permet pas d'exécuter du SQL arbitraire via rpc
        // On doit utiliser l'API REST directement ou psql

        // Solution: Afficher les commandes pour que l'utilisateur les exécute manuellement
        console.log('SQL à exécuter:', command.substring(0, 100) + '...');

      } catch (error: any) {
        console.error(`❌ Erreur lors de l'exécution:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n⚠️  IMPORTANT: Migration SQL générée');
    console.log('\nPour exécuter cette migration:');
    console.log('\n1. Copiez le contenu du fichier: scripts/fix-database.sql');
    console.log('2. Allez sur: https://supabase.com/dashboard');
    console.log('3. Sélectionnez votre projet');
    console.log('4. Allez dans "SQL Editor"');
    console.log('5. Collez le SQL et cliquez sur "RUN"\n');
    console.log('='.repeat(60));

    // Alternative: utiliser psql
    console.log('\n💡 ALTERNATIVE: Utiliser psql en ligne de commande');
    console.log('-'.repeat(60));
    console.log('\nExécutez cette commande:\n');
    console.log(`psql "${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', 'postgresql://postgres:').replace('.supabase.co', '.pooler.supabase.com:6543')}/postgres" -f scripts/fix-database.sql\n`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

runMigration().catch(console.error);
