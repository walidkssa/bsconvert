import { createClient } from '@supabase/supabase-js';

// Configuration du rate limiting
const RATE_LIMIT_CONFIG = {
  maxAttemptsPerWindow: 3, // Maximum 3 tentatives
  windowMinutes: 5, // Par fenêtre de 5 minutes
  cleanupIntervalHours: 24, // Nettoyer les entrées de plus de 24h
};

// Client Supabase avec service role key pour bypasser RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetAt: Date | null;
  message?: string;
}

/**
 * Vérifie si une IP a dépassé la limite de rate limiting
 * @param ipHash Hash SHA-256 de l'IP client
 * @returns RateLimitResult avec les détails du rate limiting
 */
export async function checkRateLimit(ipHash: string): Promise<RateLimitResult> {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT_CONFIG.windowMinutes * 60 * 1000);

    // 1. Chercher les tentatives récentes pour cette IP
    const { data: existingLimit, error: fetchError } = await supabase
      .from('free_trial_rate_limits')
      .select('*')
      .eq('ip_hash', ipHash)
      .gte('first_attempt_at', windowStart.toISOString())
      .order('first_attempt_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('Rate limit fetch error:', fetchError);
      // En cas d'erreur DB, on autorise par défaut (fail open)
      return {
        allowed: true,
        remainingAttempts: RATE_LIMIT_CONFIG.maxAttemptsPerWindow,
        resetAt: null,
      };
    }

    // 2. Pas d'entrée récente = première tentative dans cette fenêtre
    if (!existingLimit) {
      // Créer une nouvelle entrée
      const { error: insertError } = await supabase
        .from('free_trial_rate_limits')
        .insert({
          ip_hash: ipHash,
          attempt_count: 1,
          first_attempt_at: now.toISOString(),
          last_attempt_at: now.toISOString(),
        });

      if (insertError) {
        console.error('Rate limit insert error:', insertError);
      }

      return {
        allowed: true,
        remainingAttempts: RATE_LIMIT_CONFIG.maxAttemptsPerWindow - 1,
        resetAt: new Date(now.getTime() + RATE_LIMIT_CONFIG.windowMinutes * 60 * 1000),
      };
    }

    // 3. Vérifier si la limite est atteinte
    const currentAttempts = existingLimit.attempt_count || 0;

    if (currentAttempts >= RATE_LIMIT_CONFIG.maxAttemptsPerWindow) {
      // Limite atteinte
      const resetAt = new Date(
        new Date(existingLimit.first_attempt_at).getTime() +
        RATE_LIMIT_CONFIG.windowMinutes * 60 * 1000
      );

      return {
        allowed: false,
        remainingAttempts: 0,
        resetAt,
        message: `Rate limit exceeded. You can try again in ${Math.ceil((resetAt.getTime() - now.getTime()) / 60000)} minutes.`,
      };
    }

    // 4. Limite pas encore atteinte, incrémenter le compteur
    const { error: updateError } = await supabase
      .from('free_trial_rate_limits')
      .update({
        attempt_count: currentAttempts + 1,
        last_attempt_at: now.toISOString(),
      })
      .eq('id', existingLimit.id);

    if (updateError) {
      console.error('Rate limit update error:', updateError);
    }

    const remainingAttempts = RATE_LIMIT_CONFIG.maxAttemptsPerWindow - (currentAttempts + 1);
    const resetAt = new Date(
      new Date(existingLimit.first_attempt_at).getTime() +
      RATE_LIMIT_CONFIG.windowMinutes * 60 * 1000
    );

    return {
      allowed: true,
      remainingAttempts,
      resetAt,
    };

  } catch (error) {
    console.error('Rate limit check error:', error);
    // En cas d'erreur, on autorise par défaut (fail open)
    return {
      allowed: true,
      remainingAttempts: RATE_LIMIT_CONFIG.maxAttemptsPerWindow,
      resetAt: null,
    };
  }
}

/**
 * Nettoie les anciennes entrées de rate limiting (à appeler périodiquement)
 */
export async function cleanupOldRateLimits(): Promise<void> {
  try {
    const cutoffDate = new Date(
      Date.now() - RATE_LIMIT_CONFIG.cleanupIntervalHours * 60 * 60 * 1000
    );

    const { error } = await supabase
      .from('free_trial_rate_limits')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      console.error('Cleanup error:', error);
    } else {
      console.log('✅ Old rate limit entries cleaned up');
    }
  } catch (error) {
    console.error('Cleanup exception:', error);
  }
}
