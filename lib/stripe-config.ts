/**
 * Stripe Configuration & Constants
 * BS Convert Payment System
 */

export type PlanTier = 'starter' | 'professional' | 'enterprise';
export type BillingCycle = 'monthly' | 'yearly';

/**
 * STRIPE PRICE IDS
 * Ces IDs seront générés après la création des products dans Stripe Dashboard
 * ou via le script setup-stripe-products.ts
 */
export const STRIPE_PRICE_IDS = {
  starter: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY || 'price_starter_monthly',
    yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_YEARLY || 'price_starter_yearly',
  },
  professional: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
    yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly',
  },
  enterprise: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly',
    yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_YEARLY || 'price_enterprise_yearly',
  },
} as const;

/**
 * PLAN LIMITS
 * Nombre de pages (crédits) autorisées par plan et cycle
 */
export const PLAN_LIMITS = {
  starter: {
    monthly: 500,
    yearly: 6000, // 500 * 12 = 6000
  },
  professional: {
    monthly: 1500,
    yearly: 18000, // 1500 * 12 = 18000
  },
  enterprise: {
    monthly: 10000,
    yearly: 120000, // 10000 * 12 = 120000
  },
} as const;

/**
 * PLAN PRICES
 * Prix en USD (montant en centimes pour Stripe)
 */
export const PLAN_PRICES = {
  starter: {
    monthly: {
      amount: 19.99,
      stripe_amount: 1999, // en centimes
    },
    yearly: {
      amount: 180.00,
      stripe_amount: 18000,
    },
  },
  professional: {
    monthly: {
      amount: 49.99,
      stripe_amount: 4999,
    },
    yearly: {
      amount: 390.00,
      stripe_amount: 39000,
    },
  },
  enterprise: {
    monthly: {
      amount: 99.99,
      stripe_amount: 9999,
    },
    yearly: {
      amount: 890.00,
      stripe_amount: 89000,
    },
  },
} as const;

/**
 * PLAN NAMES
 * Noms affichés dans l'UI
 */
export const PLAN_NAMES: Record<PlanTier, string> = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
} as const;

/**
 * FREE TRIAL LIMITS
 * Limites pour l'essai gratuit sans compte
 */
export const FREE_TRIAL_LIMITS = {
  max_pages: 999999, // Pas de limite de pages pour l'essai gratuit
  max_conversions_per_ip: 1, // 1 seule conversion par IP
  rate_limit_per_hour: 3, // Maximum 3 tentatives par heure par IP
} as const;

/**
 * Obtenir les limites de crédits pour un plan donné
 */
export function getPlanLimit(planTier: PlanTier, billingCycle: BillingCycle): number {
  return PLAN_LIMITS[planTier][billingCycle];
}

/**
 * Obtenir le Stripe Price ID pour un plan donné
 */
export function getStripePriceId(planTier: PlanTier, billingCycle: BillingCycle): string {
  return STRIPE_PRICE_IDS[planTier][billingCycle];
}

/**
 * Obtenir le prix d'un plan
 */
export function getPlanPrice(planTier: PlanTier, billingCycle: BillingCycle) {
  return PLAN_PRICES[planTier][billingCycle];
}

/**
 * Calculer le pourcentage d'économies entre monthly et yearly
 */
export function calculateYearlySavings(planTier: PlanTier): number {
  const monthlyTotal = PLAN_PRICES[planTier].monthly.amount * 12;
  const yearlyPrice = PLAN_PRICES[planTier].yearly.amount;
  const savings = ((monthlyTotal - yearlyPrice) / monthlyTotal) * 100;
  return Math.round(savings);
}

/**
 * Obtenir tous les plans avec leurs informations
 */
export function getAllPlans() {
  const tiers: PlanTier[] = ['starter', 'professional', 'enterprise'];

  return tiers.map(tier => ({
    tier,
    name: PLAN_NAMES[tier],
    monthly: {
      price: PLAN_PRICES[tier].monthly.amount,
      pages: PLAN_LIMITS[tier].monthly,
      priceId: STRIPE_PRICE_IDS[tier].monthly,
    },
    yearly: {
      price: PLAN_PRICES[tier].yearly.amount,
      pages: PLAN_LIMITS[tier].yearly,
      priceId: STRIPE_PRICE_IDS[tier].yearly,
      savings: calculateYearlySavings(tier),
    },
  }));
}

/**
 * Vérifier si un utilisateur a assez de crédits
 */
export function hasEnoughCredits(creditsRemaining: number, pagesNeeded: number): boolean {
  return creditsRemaining >= pagesNeeded;
}

/**
 * Calculer le coût en crédits d'une conversion
 * Pour l'instant: 1 page = 1 crédit
 */
export function calculateCreditCost(pageCount: number): number {
  return pageCount;
}
