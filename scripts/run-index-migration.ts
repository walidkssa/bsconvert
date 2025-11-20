import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Starting database index migration...\n');

  const sqlFile = path.join(__dirname, 'create-performance-indexes.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (const statement of statements) {
    if (statement.includes('SELECT') && statement.includes('pg_indexes')) {
      // Skip verification query, just log it
      console.log('✅ Verification query skipped (run manually in Supabase SQL Editor)');
      continue;
    }

    console.log(`\n📝 Executing: ${statement.substring(0, 80)}...`);

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

      if (error) {
        console.error(`❌ Error: ${error.message}`);
        errorCount++;
      } else {
        console.log('✅ Success');
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Exception: ${err}`);
      errorCount++;
    }
  }

  console.log(`\n\n📊 Migration Summary:`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`\n🎉 Index migration completed!`);
}

runMigration().catch(console.error);
