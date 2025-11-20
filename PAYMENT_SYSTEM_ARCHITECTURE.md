# 🎯 ARCHITECTURE COMPLÈTE DU SYSTÈME DE PAIEMENT - BS CONVERT

**Date**: 2025-11-17
**Objectif**: Implémenter un système de paiement complet avec Stripe pour BS Convert
**Règles**: Abonnement obligatoire pour accéder au dashboard + Essai gratuit 1x par IP sur landing page

---

## 📋 TABLE DES MATIÈRES

1. [Règles Métier](#règles-métier)
2. [Architecture Base de Données](#architecture-base-de-données)
3. [Architecture API](#architecture-api)
4. [Intégration Stripe](#intégration-stripe)
5. [Flow Utilisateur](#flow-utilisateur)
6. [Sécurité & Protection](#sécurité--protection)
7. [Plan d'Implémentation](#plan-dimplémentation)

---

## 🎯 RÈGLES MÉTIER

### 1. Abonnement Obligatoire
- ✅ **Pas d'accès au dashboard sans abonnement actif**
- ✅ Après signup, l'utilisateur est redirigé vers Stripe Checkout
- ✅ Après paiement réussi, webhook Stripe active l'abonnement
- ✅ Middleware vérifie `subscription_status = 'active'` avant chaque page dashboard
- ✅ Si abonnement expiré/annulé, blocage total + redirection vers upgrade

### 2. Essai Gratuit (Landing Page uniquement)
- ✅ **Section "Try for Free" sur landing page**
- ✅ Aucune connexion requise
- ✅ Tracking par adresse IP
- ✅ **1 seule conversion gratuite par IP** (limite stricte)
- ✅ Stockage IP hashé (RGPD compliant)
- ✅ Après 1 conversion, message "Sign up to continue"
- ✅ Conversion limitée à 5 pages maximum pour l'essai gratuit

### 3. Plans & Pricing
```
Starter:       $19.99/mois = 500 pages/mois   | $180/an = 6,000 pages/an
Professional:  $49.99/mois = 1,500 pages/mois | $390/an = 18,000 pages/an  [POPULAR]
Enterprise:    $99.99/mois = 10,000 pages/mois| $890/an = 120,000 pages/an
```

### 4. Gestion des Crédits
- ✅ Crédits = Pages disponibles
- ✅ 1 page PDF = 1 crédit déduit
- ✅ Vérification AVANT conversion
- ✅ Déduction APRÈS conversion réussie
- ✅ Si crédits insuffisants → Modal "Upgrade your plan"
- ✅ Reset automatique le 1er du mois (selon billing cycle)

### 5. Calcul des Pages
- ✅ **PDF**: Extraction via `pdf-parse` → nombre de pages
- ✅ **Images (JPG/PNG)**: 1 image = 1 page
- ✅ Estimation affichée AVANT upload (si possible)
- ✅ Coût affiché: "This will use X credits"

---

## 🗄️ ARCHITECTURE BASE DE DONNÉES

### 1. Table `user_profiles`
**Rôle**: Stocker les informations d'abonnement et crédits de chaque utilisateur

```sql
CREATE TABLE user_profiles (
  -- Identification
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,

  -- Abonnement
  plan_tier VARCHAR(50) NOT NULL DEFAULT 'none',
    -- 'none', 'starter', 'professional', 'enterprise'
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
    -- 'monthly', 'yearly'
  subscription_status VARCHAR(50) NOT NULL DEFAULT 'inactive',
    -- 'inactive', 'active', 'past_due', 'canceled', 'trialing'

  -- Crédits (pages)
  credits_monthly_limit INT NOT NULL DEFAULT 0,
    -- Limite mensuelle selon plan (500, 1500, 10000)
  credits_used_this_month INT NOT NULL DEFAULT 0,
    -- Pages utilisées ce mois
  credits_remaining INT GENERATED ALWAYS AS (credits_monthly_limit - credits_used_this_month) STORED,
    -- Calculé automatiquement

  -- Stripe
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,

  -- Billing Period
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contraintes
  CONSTRAINT valid_plan CHECK (plan_tier IN ('none', 'starter', 'professional', 'enterprise')),
  CONSTRAINT valid_status CHECK (subscription_status IN ('inactive', 'active', 'past_due', 'canceled', 'trialing'))
);

-- Index pour performance
CREATE INDEX idx_user_profiles_stripe_customer ON user_profiles(stripe_customer_id);
CREATE INDEX idx_user_profiles_stripe_subscription ON user_profiles(stripe_subscription_id);
CREATE INDEX idx_user_profiles_status ON user_profiles(subscription_status);

-- Trigger pour updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);
```

### 2. Table `subscriptions`
**Rôle**: Historique complet des abonnements (renouvelements, changements de plan)

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Plan Details
  plan_tier VARCHAR(50) NOT NULL,
  billing_cycle VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Status
  status VARCHAR(50) NOT NULL,
    -- 'active', 'canceled', 'past_due', 'incomplete', 'trialing'

  -- Stripe
  stripe_subscription_id TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,

  -- Billing Dates
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Index
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);
```

### 3. Table `usage_tracking`
**Rôle**: Log de chaque conversion avec pages consommées

```sql
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversion_id UUID REFERENCES conversions(id) ON DELETE SET NULL,

  -- Usage
  pages_processed INT NOT NULL,
  credits_deducted INT NOT NULL,

  -- Context
  file_name TEXT,
  file_type TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_created_at ON usage_tracking(created_at);
CREATE INDEX idx_usage_tracking_conversion_id ON usage_tracking(conversion_id);

-- RLS
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);
```

### 4. Table `credit_transactions`
**Rôle**: Historique de toutes les transactions de crédits (déduction, reset, bonus)

```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Transaction
  transaction_type VARCHAR(50) NOT NULL,
    -- 'deduction', 'monthly_reset', 'refund', 'bonus', 'adjustment'
  amount INT NOT NULL,
    -- Positif = ajout, Négatif = déduction

  -- Context
  description TEXT,
  reference_id UUID,
    -- conversion_id ou subscription_id

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_transaction_type CHECK (
    transaction_type IN ('deduction', 'monthly_reset', 'refund', 'bonus', 'adjustment')
  )
);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at);

-- RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);
```

### 5. Table `free_trial_ips`
**Rôle**: Tracker les IPs qui ont utilisé l'essai gratuit (1x par IP)

```sql
CREATE TABLE free_trial_ips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- IP Tracking (hashé pour RGPD)
  ip_hash TEXT NOT NULL UNIQUE,
    -- SHA-256 hash de l'IP

  -- Usage
  conversions_count INT DEFAULT 1,
  last_conversion_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contrainte: maximum 1 conversion
  CONSTRAINT max_one_conversion CHECK (conversions_count <= 1)
);

CREATE INDEX idx_free_trial_ips_hash ON free_trial_ips(ip_hash);

-- Pas de RLS car table publique (lecture seule côté server)
```

### 6. Modification Table `conversions`
**Rôle**: Ajouter le tracking de pages et coût

```sql
ALTER TABLE conversions
  ADD COLUMN IF NOT EXISTS pages_count INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS credits_used INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_free_trial BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_conversions_pages_count ON conversions(pages_count);
CREATE INDEX idx_conversions_is_free_trial ON conversions(is_free_trial);
```

---

## 🚀 ARCHITECTURE API

### 1. API `/api/create-checkout-session` (POST)
**Rôle**: Créer une session Stripe Checkout pour abonnement

**Request**:
```typescript
{
  priceId: string,      // Stripe Price ID (price_xxx)
  planTier: string,     // 'starter' | 'professional' | 'enterprise'
  billingCycle: string  // 'monthly' | 'yearly'
}
```

**Logic**:
1. Vérifier authentification utilisateur
2. Récupérer/Créer Stripe Customer
3. Créer Checkout Session avec:
   - Mode: 'subscription'
   - Payment method: 'card'
   - Success URL: `${BASE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`
   - Cancel URL: `${BASE_URL}/pricing`
   - Metadata: { userId, planTier, billingCycle }
4. Retourner session.url pour redirection

**Response**:
```typescript
{
  sessionUrl: string
}
```

### 2. API `/api/webhooks/stripe` (POST)
**Rôle**: Recevoir les événements Stripe (abonnement créé, renouvelé, annulé, etc.)

**Events Gérés**:
- ✅ `checkout.session.completed` → Activer abonnement initial
- ✅ `customer.subscription.created` → Créer abonnement
- ✅ `customer.subscription.updated` → Mettre à jour abonnement (changement plan)
- ✅ `customer.subscription.deleted` → Annuler abonnement
- ✅ `invoice.payment_succeeded` → Confirmer paiement + reset crédits
- ✅ `invoice.payment_failed` → Marquer abonnement en retard

**Logic** (par événement):

**`checkout.session.completed`**:
```typescript
1. Extraire metadata (userId, planTier, billingCycle)
2. Récupérer subscription Stripe
3. Créer/Update user_profile:
   - subscription_status = 'active'
   - plan_tier = metadata.planTier
   - stripe_customer_id = customer
   - stripe_subscription_id = subscription
   - credits_monthly_limit = PLAN_LIMITS[planTier][billingCycle]
   - credits_used_this_month = 0
   - current_period_start/end = subscription dates
4. Créer entrée dans subscriptions table
5. Créer credit_transaction (type: 'monthly_reset')
```

**`invoice.payment_succeeded`**:
```typescript
1. Vérifier si c'est un renouvellement (pas le premier paiement)
2. Si renouvellement:
   - Reset credits_used_this_month = 0
   - Créer credit_transaction (type: 'monthly_reset')
   - Update current_period_start/end
3. Confirmer subscription_status = 'active'
```

**`customer.subscription.deleted`**:
```typescript
1. Update user_profile:
   - subscription_status = 'canceled'
   - credits_monthly_limit = 0
2. Update subscriptions table (status = 'canceled')
```

### 3. API `/api/create-portal-session` (POST)
**Rôle**: Créer un lien vers Stripe Customer Portal (gérer abonnement, factures, paiement)

**Logic**:
1. Récupérer user_profile.stripe_customer_id
2. Créer portal session
3. Retourner portal.url

**Response**:
```typescript
{
  url: string
}
```

### 4. API `/api/process-pdf` (MODIFIÉ)
**Rôle**: Ajouter vérification d'abonnement + déduction crédits

**Nouvelle Logic**:
```typescript
async function processPDF(file: File, userId: string) {
  // 1. VÉRIFIER ABONNEMENT ACTIF
  const profile = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profile.subscription_status !== 'active') {
    return {
      error: 'SUBSCRIPTION_REQUIRED',
      message: 'Active subscription required to convert files',
      code: 402
    };
  }

  // 2. EXTRAIRE NOMBRE DE PAGES
  let pageCount = 1;
  if (file.type === 'application/pdf') {
    const buffer = await file.arrayBuffer();
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    pageCount = data.numpages;
  }

  // 3. VÉRIFIER CRÉDITS DISPONIBLES
  if (profile.credits_remaining < pageCount) {
    return {
      error: 'INSUFFICIENT_CREDITS',
      message: `Not enough credits. Need ${pageCount}, have ${profile.credits_remaining}`,
      code: 402,
      upgrade_required: true
    };
  }

  // 4. CRÉER CONVERSION (status = 'processing')
  const conversion = await supabase.from('conversions').insert({
    user_id: userId,
    filename: file.name,
    pages_count: pageCount,
    status: 'processing'
  }).select().single();

  // 5. TRAITER AVEC GROK AI (existant)
  const result = await processWithGrokAI(file);

  // 6. SI SUCCÈS → DÉDUIRE CRÉDITS
  if (result.success) {
    // 6a. Déduire crédits
    await supabase.from('user_profiles')
      .update({
        credits_used_this_month: profile.credits_used_this_month + pageCount
      })
      .eq('id', userId);

    // 6b. Logger usage
    await supabase.from('usage_tracking').insert({
      user_id: userId,
      conversion_id: conversion.id,
      pages_processed: pageCount,
      credits_deducted: pageCount,
      file_name: file.name,
      file_type: file.type
    });

    // 6c. Logger transaction
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      transaction_type: 'deduction',
      amount: -pageCount,
      description: `Conversion: ${file.name}`,
      reference_id: conversion.id
    });

    // 6d. Update conversion
    await supabase.from('conversions').update({
      status: 'completed',
      credits_used: pageCount,
      ...result.data
    }).eq('id', conversion.id);
  }

  return result;
}
```

### 5. API `/api/free-trial-convert` (NOUVEAU)
**Rôle**: Conversion gratuite 1x par IP (landing page)

**Logic**:
```typescript
async function freeTrialConvert(file: File, ipAddress: string) {
  // 1. HASHER L'IP (RGPD)
  const crypto = require('crypto');
  const ipHash = crypto.createHash('sha256').update(ipAddress).digest('hex');

  // 2. VÉRIFIER SI IP DÉJÀ UTILISÉE
  const { data: existingTrial } = await supabase
    .from('free_trial_ips')
    .select('*')
    .eq('ip_hash', ipHash)
    .single();

  if (existingTrial) {
    return {
      error: 'TRIAL_LIMIT_REACHED',
      message: 'You have already used your free trial. Sign up to continue!',
      code: 403
    };
  }

  // 3. LIMITER À 5 PAGES MAXIMUM
  let pageCount = 1;
  if (file.type === 'application/pdf') {
    const buffer = await file.arrayBuffer();
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    pageCount = data.numpages;

    if (pageCount > 5) {
      return {
        error: 'FILE_TOO_LARGE',
        message: 'Free trial limited to 5 pages. Sign up for unlimited conversions!',
        code: 413
      };
    }
  }

  // 4. TRAITER LA CONVERSION (sans user_id)
  const result = await processWithGrokAI(file);

  // 5. SI SUCCÈS → ENREGISTRER IP
  if (result.success) {
    await supabase.from('free_trial_ips').insert({
      ip_hash: ipHash,
      conversions_count: 1
    });

    // Logger dans conversions (is_free_trial = true)
    await supabase.from('conversions').insert({
      user_id: null, // Pas d'utilisateur
      filename: file.name,
      pages_count: pageCount,
      status: 'completed',
      is_free_trial: true,
      ...result.data
    });
  }

  return result;
}
```

**Protection IP**:
```typescript
// Dans Next.js API Route
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const headersList = headers();
  const ipAddress =
    headersList.get('x-forwarded-for')?.split(',')[0] ||
    headersList.get('x-real-ip') ||
    '0.0.0.0';

  // ...
}
```

---

## 💳 INTÉGRATION STRIPE

### 1. Configuration Stripe

**Variables d'environnement** (.env.local):
```bash
# Stripe Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# URLs
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Installation**:
```bash
npm install stripe @stripe/stripe-js
```

### 2. Créer les Products & Prices dans Stripe

**Via Stripe Dashboard** ou **API**:

```typescript
// script: scripts/setup-stripe-products.ts
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function setupProducts() {
  // STARTER - Monthly
  const starterProduct = await stripe.products.create({
    name: 'BS Convert - Starter',
    description: '500 pages per month',
  });

  const starterMonthly = await stripe.prices.create({
    product: starterProduct.id,
    unit_amount: 1999, // $19.99
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: {
      plan_tier: 'starter',
      pages_limit: '500'
    }
  });

  const starterYearly = await stripe.prices.create({
    product: starterProduct.id,
    unit_amount: 18000, // $180
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: {
      plan_tier: 'starter',
      pages_limit: '6000'
    }
  });

  // PROFESSIONAL - Monthly
  const proProduct = await stripe.products.create({
    name: 'BS Convert - Professional',
    description: '1,500 pages per month',
  });

  const proMonthly = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 4999, // $49.99
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: {
      plan_tier: 'professional',
      pages_limit: '1500'
    }
  });

  const proYearly = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 39000, // $390
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: {
      plan_tier: 'professional',
      pages_limit: '18000'
    }
  });

  // ENTERPRISE - Monthly
  const enterpriseProduct = await stripe.products.create({
    name: 'BS Convert - Enterprise',
    description: '10,000 pages per month',
  });

  const enterpriseMonthly = await stripe.prices.create({
    product: enterpriseProduct.id,
    unit_amount: 9999, // $99.99
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: {
      plan_tier: 'enterprise',
      pages_limit: '10000'
    }
  });

  const enterpriseYearly = await stripe.prices.create({
    product: enterpriseProduct.id,
    unit_amount: 89000, // $890
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: {
      plan_tier: 'enterprise',
      pages_limit: '120000'
    }
  });

  console.log('Stripe Products Created!');
  console.log({
    starter: {
      monthly: starterMonthly.id,
      yearly: starterYearly.id
    },
    professional: {
      monthly: proMonthly.id,
      yearly: proYearly.id
    },
    enterprise: {
      monthly: enterpriseMonthly.id,
      yearly: enterpriseYearly.id
    }
  });
}

setupProducts();
```

**Stocker les Price IDs** dans constantes:
```typescript
// lib/stripe-config.ts
export const STRIPE_PRICE_IDS = {
  starter: {
    monthly: 'price_xxxxx',
    yearly: 'price_yyyyy'
  },
  professional: {
    monthly: 'price_zzzzz',
    yearly: 'price_aaaaa'
  },
  enterprise: {
    monthly: 'price_bbbbb',
    yearly: 'price_ccccc'
  }
} as const;

export const PLAN_LIMITS = {
  starter: {
    monthly: 500,
    yearly: 6000
  },
  professional: {
    monthly: 1500,
    yearly: 18000
  },
  enterprise: {
    monthly: 10000,
    yearly: 120000
  }
} as const;
```

### 3. Stripe Customer Portal Configuration

**Dans Stripe Dashboard**:
1. Aller dans Settings → Billing → Customer Portal
2. Activer:
   - ✅ Customers can update payment methods
   - ✅ Customers can view invoices
   - ✅ Customers can cancel subscriptions (immediate ou fin période)
   - ✅ Customers can update subscription (upgrade/downgrade)
3. Configurer les URLs:
   - Default return URL: `https://yourapp.com/dashboard/billing`

---

## 👤 FLOW UTILISATEUR

### Flow A: Nouvel Utilisateur → Abonnement

```
1. Landing Page → Clic "Get Started" ou "Start Converting Free"
   ↓
2. Page /auth/signup
   - Créer compte (email + password)
   - Supabase Auth crée user dans auth.users
   ↓
3. Trigger Database (onCreate user):
   - Créer user_profile avec subscription_status = 'inactive'
   ↓
4. Redirection automatique → /pricing?required=true
   - Message: "Choose a plan to start converting"
   ↓
5. Utilisateur clique sur un plan
   - Appel API /api/create-checkout-session
   - Redirection vers Stripe Checkout
   ↓
6. Stripe Checkout (paiement)
   - Utilisateur entre carte bancaire
   - Paiement validé
   ↓
7. Webhook Stripe: checkout.session.completed
   - Activer abonnement dans user_profiles
   - subscription_status = 'active'
   - Allouer crédits mensuels
   ↓
8. Redirection → /dashboard?session_id=xxx
   - Success toast: "Welcome! Your subscription is active"
   - Affichage crédits: "485 / 500 pages remaining"
   ↓
9. Dashboard accessible ✅
```

### Flow B: Utilisateur Existant → Renouvellement Auto

```
1. 30 jours après souscription
   ↓
2. Stripe charge automatiquement la carte
   ↓
3. Webhook: invoice.payment_succeeded
   - Reset credits_used_this_month = 0
   - Update current_period_start/end
   - Créer credit_transaction (monthly_reset)
   ↓
4. User voit crédits restaurés: "0 / 500 pages used"
```

### Flow C: Utilisateur Sans Abonnement → Blocage

```
1. User se connecte (abonnement expiré/annulé)
   ↓
2. Middleware détecte subscription_status != 'active'
   ↓
3. Redirection forcée → /pricing?required=true
   - Alert: "Your subscription has expired. Please renew to continue."
   ↓
4. Accès dashboard bloqué jusqu'à renouvellement
```

### Flow D: Essai Gratuit (Sans Compte)

```
1. Landing Page → Section "Try for Free"
   ↓
2. Upload fichier (max 5 pages)
   - Pas de login required
   ↓
3. API vérifie IP hash
   - Si IP déjà utilisée → Message: "Sign up to continue"
   - Si nouvelle IP → Conversion autorisée
   ↓
4. Conversion traitée
   - Résultat affiché
   - IP hashée stockée dans free_trial_ips
   ↓
5. Message après conversion:
   "Free trial used! Sign up for unlimited conversions"
   + Bouton "Create Free Account"
   ↓
6. Si 2ème tentative avec même IP → Blocage total
```

### Flow E: Crédits Épuisés

```
1. User upload fichier (10 pages)
   ↓
2. API vérifie crédits: remaining = 3 pages
   ↓
3. Erreur 402: INSUFFICIENT_CREDITS
   ↓
4. Modal s'affiche:
   "You need 10 credits but only have 3 remaining.
    Upgrade your plan or wait until next billing cycle."
   + Bouton "Upgrade Now" → /dashboard/billing
   ↓
5. User peut:
   - Upgrade vers plan supérieur (immédiat)
   - Attendre reset mensuel
```

---

## 🔒 SÉCURITÉ & PROTECTION

### 1. Protection Webhook Stripe
```typescript
// Vérifier signature Stripe
import { headers } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed');
    return new Response('Webhook Error', { status: 400 });
  }

  // Traiter event...
}
```

### 2. Protection IP (RGPD Compliant)
```typescript
// Ne JAMAIS stocker IP en clair
import crypto from 'crypto';

function hashIP(ip: string): string {
  const salt = process.env.IP_SALT; // Secret dans .env
  return crypto
    .createHash('sha256')
    .update(ip + salt)
    .digest('hex');
}
```

### 3. Middleware Protection Dashboard
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Vérifier auth
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // Vérifier abonnement pour /dashboard
  if (user && req.nextUrl.pathname.startsWith('/dashboard')) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single();

    if (profile?.subscription_status !== 'active') {
      return NextResponse.redirect(
        new URL('/pricing?required=true', req.url)
      );
    }
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*']
};
```

### 4. Rate Limiting (Essai Gratuit)
```typescript
// Protection DDoS sur /api/free-trial-convert
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, '1 h'), // 3 tentatives par heure
  analytics: true,
});

export async function POST(req: Request) {
  const ip = getIP(req);
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }

  // ...
}
```

---

## 📅 PLAN D'IMPLÉMENTATION

### Phase 1: Base de Données (Jour 1 - 2h)
- ✅ Créer migration Supabase avec toutes les tables
- ✅ Configurer RLS policies
- ✅ Créer triggers et fonctions
- ✅ Tester migrations en local

### Phase 2: Stripe Setup (Jour 1 - 1h)
- ✅ Créer compte Stripe (mode test)
- ✅ Créer products & prices
- ✅ Configurer Customer Portal
- ✅ Configurer webhooks endpoint
- ✅ Stocker Price IDs dans config

### Phase 3: API Routes (Jour 1-2 - 4h)
- ✅ `/api/create-checkout-session`
- ✅ `/api/webhooks/stripe`
- ✅ `/api/create-portal-session`
- ✅ `/api/free-trial-convert`
- ✅ Modifier `/api/process-pdf`

### Phase 4: Extraction Pages PDF (Jour 2 - 1h)
- ✅ Installer `pdf-parse`
- ✅ Implémenter extraction dans `/api/process-pdf`
- ✅ Gérer cas images (1 page)

### Phase 5: UI Dashboard (Jour 2 - 3h)
- ✅ Widget crédits (header ou sidebar)
- ✅ Modal "Insufficient Credits"
- ✅ Page `/dashboard/billing`
- ✅ Boutons "Upgrade" partout

### Phase 6: Landing Page (Jour 2 - 2h)
- ✅ Section "Try for Free" (sans login)
- ✅ Upload + conversion gratuite
- ✅ Message limite IP

### Phase 7: Middleware & Protection (Jour 3 - 2h)
- ✅ Middleware subscription check
- ✅ Redirection forcée /pricing
- ✅ Protection webhooks
- ✅ Rate limiting

### Phase 8: Tests (Jour 3 - 2h)
- ✅ Test flow complet signup → checkout → webhook
- ✅ Test déduction crédits
- ✅ Test reset mensuel (webhook simulation)
- ✅ Test essai gratuit IP
- ✅ Test blocage sans abonnement

### Phase 9: Production (Jour 3 - 1h)
- ✅ Déployer migrations Supabase
- ✅ Configurer webhooks Stripe en production
- ✅ Variables d'environnement Vercel/Production
- ✅ Test final en prod

**Total: ~17-18 heures de développement**

---

## 📊 MÉTRIQUES À TRACKER

### Dashboard Admin (Future)
- Nombre d'abonnés par plan
- MRR (Monthly Recurring Revenue)
- Churn rate
- Pages consommées totales
- Top utilisateurs (par usage)
- Conversions abandonnées (crédits insuffisants)
- Taux conversion essai gratuit → signup

---

## 🎨 UI/UX CONSIDERATIONS

### 1. Widget Crédits (Sidebar)
```tsx
<Card>
  <CardHeader>
    <CardTitle>Pages This Month</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Used</span>
        <span className="font-medium">
          {usedCredits} / {totalCredits}
        </span>
      </div>
      <Progress value={(usedCredits / totalCredits) * 100} />
      <Button variant="outline" size="sm" className="w-full">
        Upgrade Plan
      </Button>
    </div>
  </CardContent>
</Card>
```

### 2. Modal Insufficient Credits
```tsx
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Not Enough Credits</AlertDialogTitle>
      <AlertDialogDescription>
        This conversion requires {pagesNeeded} pages but you only have{' '}
        {creditsRemaining} remaining this month.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleUpgrade}>
        Upgrade Plan
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 3. Section Essai Gratuit (Landing)
```tsx
<section className="py-20 bg-muted">
  <div className="container">
    <h2 className="text-3xl font-bold text-center mb-4">
      Try BS Convert Free
    </h2>
    <p className="text-center text-muted-foreground mb-8">
      No credit card required. Convert one file for free!
    </p>
    <Card className="max-w-md mx-auto">
      <CardContent className="pt-6">
        <FileUpload onUpload={handleFreeTrialUpload} />
        <p className="text-xs text-muted-foreground mt-4">
          Limited to 5 pages. One free conversion per device.
        </p>
      </CardContent>
    </Card>
  </div>
</section>
```

---

## ✅ CHECKLIST FINALE

### Avant Production
- [ ] Tous les webhooks Stripe configurés
- [ ] Variables d'environnement en production
- [ ] Migrations Supabase déployées
- [ ] Tests complets signup → paiement → accès
- [ ] Tests webhooks avec Stripe CLI
- [ ] Tests essai gratuit multi-IP
- [ ] Documentation API interne
- [ ] Monitoring errors (Sentry)
- [ ] Logging webhooks Stripe
- [ ] Customer support plan (help desk)

### Après Lancement
- [ ] Monitorer taux conversion
- [ ] Analyser abandons panier Stripe
- [ ] Optimiser pricing si besoin
- [ ] Ajouter analytics (Mixpanel, Amplitude)
- [ ] Email marketing (Mailchimp/SendGrid)
- [ ] Newsletter pour upgrades
- [ ] Programme d'affiliation (optionnel)

---

**FIN DU DOCUMENT** 🎉

Ce plan est complet et prêt pour implémentation. Commençons par la Phase 1!
