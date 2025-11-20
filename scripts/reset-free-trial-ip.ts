/**
 * Script pour réinitialiser l'IP de test dans free_trial_ips
 * Utile pour tester la fonctionnalité free trial plusieurs fois
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetFreeTrialIP() {
  console.log('🔄 Resetting free trial IPs...');

  // Supprimer TOUTES les entrées de test
  const { error } = await supabase
    .from('free_trial_ips')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except impossible UUID

  if (error) {
    console.error('❌ Error resetting free trial IPs:', error);
    process.exit(1);
  }

  console.log('✅ All free trial IPs have been reset!');
  console.log('💡 You can now test the free trial again');
}

resetFreeTrialIP();
