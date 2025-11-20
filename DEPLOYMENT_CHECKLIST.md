# ✅ BS Convert - Checklist de Déploiement du Système de Paiement

Guide étape par étape pour configurer le système de paiement complet.

---

## 📦 PHASE 1: INSTALLATION DES DÉPENDANCES

### Étape 1.1: Installer les packages npm

```bash
npm install stripe @stripe/stripe-js pdf-parse
npm install -D tsx
```

**Vérification**:
```bash
npm list stripe @stripe/stripe-js pdf-parse
```

✅ **Terminé**: [ ]

---

## 🗄️ PHASE 2: DÉPLOYER LA MIGRATION SUPABASE

### Étape 2.1: Accéder à Supabase Dashboard

1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet BS Convert
3. Cliquer sur **SQL Editor** dans la sidebar gauche

✅ **Terminé**: [ ]

### Étape 2.2: Exécuter la migration

1. Cliquer sur **New query**
2. Ouvrir le fichier: `/Users/walidkoussa/bsconvert/supabase/migrations/20250117_payment_system.sql`
3. Copier TOUT le contenu du fichier
4. Coller dans l'éditeur SQL Supabase
5. Cliquer sur **Run** (bouton en bas à droite)

**Attendre le message de succès** ✓

✅ **Terminé**: [ ]

### Étape 2.3: Vérifier les tables créées

Dans SQL Editor, exécuter:

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
  )
ORDER BY table_name;
```

**Résultat attendu**: 5 tables affichées

✅ **Terminé**: [ ]

---

## 💳 PHASE 3: CONFIGURER STRIPE

### Étape 3.1: Créer/Accéder au compte Stripe

1. Aller sur https://dashboard.stripe.com
2. Si pas de compte: créer un compte gratuit
3. **Rester en mode TEST** (toggle en haut à droite)

✅ **Terminé**: [ ]

### Étape 3.2: Récupérer les clés API

1. Aller sur https://dashboard.stripe.com/test/apikeys
2. Copier:
   - **Publishable key** (commence par `pk_test_`)
   - **Secret key** (cliquer sur "Reveal test key", commence par `sk_test_`)

**NOTE**: Garder ces clés dans un endroit sûr (on va les ajouter dans .env.local à l'étape suivante)

✅ **Terminé**: [ ]

### Étape 3.3: Configurer .env.local

1. Ouvrir le fichier `.env.local` à la racine du projet
2. Ajouter/Mettre à jour ces lignes:

```bash
# Stripe (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_PUBLIQUE
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE

# Base URL (localhost pour dev)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

3. Sauvegarder le fichier

✅ **Terminé**: [ ]

### Étape 3.4: Générer le salt pour IP hashing

Dans le terminal:

```bash
openssl rand -base64 32
```

Copier le résultat et l'ajouter dans `.env.local`:

```bash
# IP Hashing Salt
IP_SALT=VOTRE_SALT_GENERE
```

✅ **Terminé**: [ ]

---

## 🏗️ PHASE 4: CRÉER LES PRODUCTS STRIPE

### Étape 4.1: Installer Stripe CLI (optionnel mais recommandé)

**macOS**:
```bash
brew install stripe/stripe-cli/stripe
```

**Windows/Linux**: Télécharger depuis https://stripe.com/docs/stripe-cli

✅ **Terminé**: [ ]

### Étape 4.2: Se connecter à Stripe CLI

```bash
stripe login
```

Suivre les instructions (ouvrir le navigateur et autoriser)

✅ **Terminé**: [ ]

### Étape 4.3: Créer les products et prices

```bash
npx tsx scripts/setup-stripe-products.ts
```

**Résultat attendu**:
- 3 products créés (Starter, Professional, Enterprise)
- 6 prices créés (monthly + yearly pour chaque)
- Affichage des Price IDs

**IMPORTANT**: Copier TOUS les Price IDs affichés dans la console

✅ **Terminé**: [ ]

### Étape 4.4: Ajouter les Price IDs dans .env.local

Ouvrir `.env.local` et ajouter:

```bash
# Stripe Price IDs (copier depuis la sortie du script)
NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_STARTER_YEARLY=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_YEARLY=price_xxxxx
```

Remplacer `price_xxxxx` par les vrais IDs

✅ **Terminé**: [ ]

---

## 🔗 PHASE 5: CONFIGURER LES WEBHOOKS STRIPE

### Étape 5.1: Démarrer le serveur de dev

Dans un terminal:

```bash
npm run dev
```

Laisser tourner (ne pas fermer ce terminal)

✅ **Terminé**: [ ]

### Étape 5.2: Écouter les webhooks (dans un NOUVEAU terminal)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Résultat attendu**: Message indiquant que le webhook écoute

**IMPORTANT**: Copier le **webhook signing secret** affiché (commence par `whsec_`)

✅ **Terminé**: [ ]

### Étape 5.3: Ajouter le webhook secret dans .env.local

Ouvrir `.env.local` et ajouter:

```bash
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET
```

**IMPORTANT**: Redémarrer le serveur de dev après avoir modifié .env.local
- Arrêter avec Ctrl+C dans le terminal du serveur
- Relancer: `npm run dev`

✅ **Terminé**: [ ]

---

## 🎨 PHASE 6: CONFIGURER LE CUSTOMER PORTAL

### Étape 6.1: Activer le Customer Portal

1. Aller sur https://dashboard.stripe.com/test/settings/billing/portal
2. Cliquer sur **Activate test link**

✅ **Terminé**: [ ]

### Étape 6.2: Configurer les options

Cocher ces options:
- ✅ **Invoice history** (Historique des factures)
- ✅ **Update payment method** (Modifier mode de paiement)
- ✅ **Cancel subscriptions** (Annuler abonnement)

✅ **Terminé**: [ ]

### Étape 6.3: Configurer l'URL de retour

Dans "Default return URL":
```
http://localhost:3000/dashboard/billing
```

Cliquer sur **Save changes**

✅ **Terminé**: [ ]

---

## 🧪 PHASE 7: TESTS DE VÉRIFICATION

### Test 7.1: Vérifier que le serveur tourne

Ouvrir http://localhost:3000/landing dans le navigateur

**Résultat attendu**: La landing page s'affiche normalement

✅ **Terminé**: [ ]

### Test 7.2: Vérifier Stripe Checkout

1. Aller sur http://localhost:3000/pricing
2. Cliquer sur "Start Professional" (ou n'importe quel bouton)
3. **Résultat attendu**: Devrait rediriger vers une page Stripe Checkout

**Note**: Pour l'instant, le bouton ne redirigera PAS encore vers Stripe (c'est normal, on doit coder les API routes dans la prochaine phase)

✅ **Terminé**: [ ]

### Test 7.3: Vérifier les webhooks

Dans le terminal où `stripe listen` tourne, vous devriez voir des événements s'afficher quand vous interagissez avec Stripe.

✅ **Terminé**: [ ]

### Test 7.4: Tester une carte de paiement Stripe

Carte de test Stripe (toujours acceptée):
```
Numéro: 4242 4242 4242 4242
Date expiration: n'importe quelle date future (ex: 12/34)
CVC: n'importe quel 3 chiffres (ex: 123)
ZIP: n'importe quel code (ex: 12345)
```

✅ **Terminé**: [ ]

---

## 📝 PHASE 8: VÉRIFICATION FINALE

### Checklist complète

- [ ] ✅ Packages npm installés (stripe, pdf-parse, tsx)
- [ ] ✅ Migration Supabase déployée
- [ ] ✅ 5 nouvelles tables créées dans Supabase
- [ ] ✅ Compte Stripe créé (mode TEST)
- [ ] ✅ Clés API Stripe récupérées
- [ ] ✅ .env.local configuré avec clés Stripe
- [ ] ✅ Salt IP généré et ajouté
- [ ] ✅ Stripe CLI installé et connecté
- [ ] ✅ 3 products Stripe créés
- [ ] ✅ 6 prices Stripe créés
- [ ] ✅ Price IDs ajoutés dans .env.local
- [ ] ✅ Serveur de dev démarré (npm run dev)
- [ ] ✅ Stripe listen démarré (webhooks)
- [ ] ✅ Webhook secret ajouté dans .env.local
- [ ] ✅ Customer Portal activé et configuré
- [ ] ✅ Landing page accessible
- [ ] ✅ Pricing page accessible

---

## 🎯 PROCHAINES ÉTAPES

Une fois TOUTES les étapes ci-dessus complétées, on pourra passer à:

1. **Coder les API Routes**:
   - `/api/create-checkout-session` (créer session Stripe)
   - `/api/webhooks/stripe` (recevoir événements Stripe)
   - `/api/create-portal-session` (gérer abonnement)
   - `/api/free-trial-convert` (essai gratuit)
   - Modifier `/api/process-pdf` (vérifier crédits)

2. **Créer les UI Components**:
   - Widget affichage crédits
   - Modal blocage crédits épuisés
   - Page billing (/dashboard/billing)
   - Section essai gratuit landing page

3. **Ajouter le Middleware**:
   - Bloquer accès dashboard sans abonnement
   - Redirection automatique vers pricing

---

## 🆘 AIDE / PROBLÈMES

### Problème: npm install échoue

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Problème: Migration Supabase échoue

**Solution**: Vérifier qu'il n'y a pas de tables en conflit. Si oui, les supprimer d'abord:

```sql
DROP TABLE IF EXISTS free_trial_ips CASCADE;
DROP TABLE IF EXISTS credit_transactions CASCADE;
DROP TABLE IF EXISTS usage_tracking CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
```

Puis réexécuter la migration.

### Problème: Stripe CLI ne se connecte pas

**Solution**:
```bash
stripe login --api-key sk_test_VOTRE_CLE
```

### Problème: Webhook secret invalide

**Solution**: Copier exactement le secret affiché par `stripe listen`, il doit commencer par `whsec_`

---

## 📞 STATUT ACTUEL

**Date**: ___________

**Phases complétées**:
- [ ] Phase 1: Dépendances
- [ ] Phase 2: Migration Supabase
- [ ] Phase 3: Configuration Stripe
- [ ] Phase 4: Products Stripe
- [ ] Phase 5: Webhooks
- [ ] Phase 6: Customer Portal
- [ ] Phase 7: Tests
- [ ] Phase 8: Vérification

**Prêt pour la suite**: [ ] OUI / [ ] NON

---

**Commence par la Phase 1 et coche chaque étape au fur et à mesure !** 🚀
