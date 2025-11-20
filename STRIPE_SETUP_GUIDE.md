# 🚀 BS Convert - Stripe Setup Guide

Guide complet pour configurer le système de paiement avec Stripe.

---

## 📋 PRÉREQUIS

- [ ] Compte Stripe créé (https://dashboard.stripe.com)
- [ ] Supabase project configuré
- [ ] Node.js 18+ installé
- [ ] `stripe` et `@stripe/stripe-js` installés via npm

---

## 🔧 ÉTAPE 1: INSTALLER LES DÉPENDANCES

```bash
npm install stripe @stripe/stripe-js pdf-parse
npm install -D tsx
```

---

## 🗄️ ÉTAPE 2: DÉPLOYER LES MIGRATIONS SUPABASE

### Option A: Via Supabase CLI (Recommandé)

```bash
# Installer Supabase CLI si pas encore fait
npm install -g supabase

# Se connecter à votre projet
supabase link --project-ref your-project-ref

# Appliquer la migration
supabase db push

# Ou spécifiquement:
supabase migration up
```

### Option B: Via Supabase Dashboard

1. Aller dans votre projet Supabase: https://supabase.com/dashboard
2. Cliquer sur **SQL Editor** dans la sidebar
3. Créer une nouvelle query
4. Copier tout le contenu de `supabase/migrations/20250117_payment_system.sql`
5. Coller dans l'éditeur et cliquer sur **Run**

### Vérification

Après la migration, vérifiez que les tables ont bien été créées:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'user_profiles',
    'subscriptions',
    'usage_tracking',
    'credit_transactions',
    'free_trial_ips'
  );
```

Vous devriez voir toutes ces 5 tables.

---

## 💳 ÉTAPE 3: CONFIGURER STRIPE

### 3.1 Obtenir les clés API Stripe

1. Aller sur https://dashboard.stripe.com/test/apikeys
2. Copier:
   - **Publishable key** (commence par `pk_test_`)
   - **Secret key** (commence par `sk_test_`)

### 3.2 Ajouter les clés dans `.env.local`

```bash
# Copier le fichier exemple
cp .env.example .env.local

# Éditer .env.local et remplir:
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
```

### 3.3 Créer les Products & Prices Stripe

Exécuter le script de setup:

```bash
npx tsx scripts/setup-stripe-products.ts
```

Ce script va:
1. Créer 3 products dans Stripe (Starter, Professional, Enterprise)
2. Créer 6 prices (monthly + yearly pour chaque plan)
3. Afficher les Price IDs à copier

**IMPORTANT**: Copier TOUS les Price IDs affichés et les ajouter dans `.env.local`:

```bash
NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_STARTER_YEARLY=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_YEARLY=price_xxxxx
```

---

## 🔗 ÉTAPE 4: CONFIGURER LES WEBHOOKS STRIPE

### 4.1 Installation Stripe CLI (pour développement local)

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Autres OS: https://stripe.com/docs/stripe-cli
```

### 4.2 Se connecter à Stripe

```bash
stripe login
```

### 4.3 Tester les webhooks en local

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copier le **webhook signing secret** affiché (commence par `whsec_`) et l'ajouter dans `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 4.4 Configurer les webhooks en production

1. Aller sur https://dashboard.stripe.com/test/webhooks
2. Cliquer sur **Add endpoint**
3. URL du endpoint: `https://votre-domaine.com/api/webhooks/stripe`
4. Sélectionner les événements:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
5. Cliquer sur **Add endpoint**
6. Copier le **Signing secret** et l'ajouter dans vos variables d'environnement production

---

## 🎨 ÉTAPE 5: CONFIGURER LE CUSTOMER PORTAL

1. Aller sur https://dashboard.stripe.com/test/settings/billing/portal
2. Activer le Customer Portal
3. Configurer:
   - ✅ **Allow customers to update payment methods**
   - ✅ **Allow customers to view invoices**
   - ✅ **Allow customers to cancel subscriptions**
   - ✅ **Allow customers to switch plans**
4. Default return URL: `https://votre-domaine.com/dashboard/billing`
5. Sauvegarder

---

## 🔐 ÉTAPE 6: GÉNÉRER UN SALT POUR LE HASHING D'IP

```bash
openssl rand -base64 32
```

Ajouter le résultat dans `.env.local`:

```bash
IP_SALT=votre-salt-généré
```

---

## ✅ ÉTAPE 7: VÉRIFICATION

### Checklist finale

- [ ] Toutes les migrations Supabase appliquées
- [ ] Les 5 nouvelles tables existent dans Supabase
- [ ] Clés Stripe (publishable + secret) dans `.env.local`
- [ ] 6 Price IDs Stripe dans `.env.local`
- [ ] Webhook secret dans `.env.local`
- [ ] IP salt généré et dans `.env.local`
- [ ] Customer Portal configuré
- [ ] Stripe CLI installé (pour dev)

### Test rapide

```bash
# Démarrer le serveur de dev
npm run dev

# Dans un autre terminal, écouter les webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Visitez: http://localhost:3000/pricing

---

## 🧪 ÉTAPE 8: TESTER LE FLOW COMPLET

### Test 1: Signup → Checkout → Webhook

1. Créer un nouveau compte sur `/auth/signup`
2. Vérifier que `user_profiles` a une entrée avec `subscription_status = 'inactive'`
3. Aller sur `/pricing`
4. Cliquer sur un plan
5. Utiliser une carte de test Stripe: `4242 4242 4242 4242`
6. Compléter le paiement
7. Vérifier le webhook dans le terminal Stripe CLI
8. Vérifier que `user_profiles.subscription_status` est maintenant `'active'`
9. Vérifier que `subscriptions` a une nouvelle entrée
10. Accéder au dashboard → devrait fonctionner ✅

### Test 2: Vérifier les crédits

1. Se connecter avec un compte qui a un abonnement actif
2. Vérifier que le dashboard affiche les crédits disponibles
3. Uploader un fichier PDF
4. Vérifier que les crédits sont déduits après conversion
5. Vérifier les tables:
   - `usage_tracking` a une entrée
   - `credit_transactions` a une entrée (type: 'deduction')
   - `user_profiles.credits_used_this_month` a augmenté

### Test 3: Blocage sans abonnement

1. Créer un nouveau compte
2. Ne PAS souscrire à un plan
3. Essayer d'accéder à `/dashboard`
4. Devrait être redirigé vers `/pricing?required=true` ✅

### Test 4: Essai gratuit (Landing Page)

1. Ouvrir mode navigation privée
2. Aller sur la landing page
3. Uploader un fichier dans la section "Try for Free"
4. Vérifier que la conversion fonctionne
5. Essayer une 2ème fois → devrait être bloqué ✅
6. Vérifier que `free_trial_ips` a une entrée avec l'IP hashée

---

## 🔄 ÉTAPE 9: DÉPLOIEMENT EN PRODUCTION

### 9.1 Variables d'environnement Vercel

Ajouter toutes les variables dans Vercel Dashboard:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# XAI
XAI_API_KEY=

# Stripe LIVE (remplacer par les clés live)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Price IDs (refaire le script avec clés live ou copier depuis dashboard)
NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY=
NEXT_PUBLIC_STRIPE_PRICE_STARTER_YEARLY=
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY=
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_YEARLY=

# App
NEXT_PUBLIC_BASE_URL=https://votre-domaine.com
IP_SALT=
```

### 9.2 Configurer webhook production

1. Aller sur https://dashboard.stripe.com/webhooks (mode LIVE)
2. Ajouter endpoint: `https://votre-domaine.com/api/webhooks/stripe`
3. Sélectionner les mêmes événements
4. Copier le signing secret et l'ajouter dans Vercel

### 9.3 Activer le mode LIVE Stripe

1. Toggle dans Stripe Dashboard: Test mode → Live mode
2. Recréer les products/prices en mode live (ou réexécuter le script avec clés live)
3. Reconfigurer Customer Portal en mode live

---

## 📊 MONITORING & LOGS

### Vérifier les logs Stripe

- Webhooks: https://dashboard.stripe.com/test/webhooks
- Payments: https://dashboard.stripe.com/test/payments
- Subscriptions: https://dashboard.stripe.com/test/subscriptions
- Customers: https://dashboard.stripe.com/test/customers

### Vérifier les logs Supabase

```sql
-- Voir tous les profils
SELECT * FROM user_profiles;

-- Voir les abonnements actifs
SELECT * FROM subscriptions WHERE status = 'active';

-- Voir l'usage récent
SELECT * FROM usage_tracking ORDER BY created_at DESC LIMIT 10;

-- Voir les transactions de crédits
SELECT * FROM credit_transactions ORDER BY created_at DESC LIMIT 20;
```

---

## 🆘 TROUBLESHOOTING

### Problème: Webhook ne fonctionne pas

**Solution**:
1. Vérifier que Stripe CLI écoute: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
2. Vérifier le webhook secret dans `.env.local`
3. Vérifier les logs dans le terminal Stripe CLI
4. Tester manuellement: `stripe trigger checkout.session.completed`

### Problème: Crédits non déduits

**Solution**:
1. Vérifier que le webhook `invoice.payment_succeeded` a bien été reçu
2. Vérifier les logs dans `credit_transactions`
3. Vérifier que la fonction `deduct_credits()` ne retourne pas d'erreur

### Problème: Dashboard accessible sans abonnement

**Solution**:
1. Vérifier que le middleware est bien configuré dans `middleware.ts`
2. Vérifier que `user_profiles.subscription_status` est bien à jour
3. Vérifier la logique du middleware

### Problème: Essai gratuit ne bloque pas après 1 conversion

**Solution**:
1. Vérifier que l'IP est bien hashée
2. Vérifier la table `free_trial_ips`
3. Vérifier le salt dans `.env.local`
4. Tester avec différentes IPs (VPN, navigation privée)

---

## 📚 RESSOURCES

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Cards](https://stripe.com/docs/testing)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

## ✅ RÉCAPITULATIF

Vous avez maintenant un système de paiement complet avec:

✅ Base de données avec 5 nouvelles tables
✅ Intégration Stripe complète
✅ 3 plans tarifaires (Starter, Pro, Enterprise)
✅ Système de crédits par pages
✅ Webhooks automatiques
✅ Essai gratuit limité par IP
✅ Blocage dashboard sans abonnement
✅ Customer Portal Stripe

**Prochaines étapes**: Implémenter les UI (widgets crédits, modals, page billing).
