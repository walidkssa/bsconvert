# 🔴 RAPPORT: PROBLÈME WEBHOOK STRIPE

**Date**: 18 Novembre 2025
**Status**: ✅ RÉSOLU MANUELLEMENT - ⚠️ WEBHOOK RESTE À CONFIGURER

---

## 🚨 PROBLÈME IDENTIFIÉ

### Symptôme
Lorsque l'utilisateur souscrit à un plan Stripe, son compte BS Convert **ne se met PAS à jour automatiquement**.

### Diagnostic
1. ✅ **Payment Stripe**: Fonctionne correctement
2. ✅ **Subscription Stripe**: Créée correctement (ID: `sub_1SUZ7QGvVp3BcsE87WGQE8Xn`)
3. ❌ **Webhook Stripe**: **NE S'EST PAS DÉCLENCHÉ**

### Preuve
```bash
# État AVANT correction manuelle:
Plan: starter (mais devrait être mis à jour)
Crédits: 497/500
Stripe Sub ID: sub_1SUZ7QGvVp3BcsE87WGQE8Xn

# Table subscriptions: VIDE (aucune entrée)
# = Preuve que checkout.session.completed n'a jamais été déclenché
```

---

## 🔍 CAUSE RACINE

Le webhook Stripe n'est **pas correctement configuré** ou **n'est pas actif**.

### Vérifications nécessaires:

1. **Aller sur Stripe Dashboard** → **Webhooks**
2. Vérifier l'URL du webhook:
   ```
   https://bsconvert.com/api/webhooks/stripe
   ```
3. Vérifier les événements écoutés:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

4. Vérifier le **Webhook Secret** dans `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

---

## ✅ SOLUTION TEMPORAIRE APPLIQUÉE

Un script de correction manuelle a été créé et exécuté:

### Script: `/scripts/fix-upgrade-manually.ts`

**Fonctionnalités:**
1. Récupère l'abonnement Stripe de l'utilisateur
2. Détecte le plan et cycle de facturation basé sur le montant payé
3. Met à jour `user_profiles`:
   - `plan_tier`
   - `billing_cycle`
   - `credits_monthly_limit`
   - `credits_used_this_month = 0` (reset)
   - `subscription_status = 'active'`
4. Crée l'entrée dans la table `subscriptions`
5. Logger une transaction de crédit

**Résultat:**
```bash
✅ Plan: starter
✅ Crédits: 0/500
✅ Restants: 500 pages
```

---

## 🛠️ SOLUTION PERMANENTE

### Étape 1: Configurer le Webhook Stripe

1. **Aller sur**: [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)

2. **Créer un nouveau endpoint** (ou vérifier l'existant):
   - **URL**: `https://bsconvert.com/api/webhooks/stripe`
   - **Événements à sélectionner**:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

3. **Copier le Webhook Signing Secret**:
   - Il commence par `whsec_...`
   - Le mettre dans `.env.local`:
     ```bash
     STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
     ```

4. **Redéployer l'application** pour que le secret soit pris en compte

### Étape 2: Tester le Webhook

1. **Dans Stripe Dashboard → Webhooks → Votre endpoint**
2. Cliquer sur "Send test webhook"
3. Sélectionner `checkout.session.completed`
4. Vérifier les logs de votre application:
   ```bash
   ✅ Received webhook: checkout.session.completed
   🎉 Processing checkout.session.completed
   ✅ User xxx subscribed to starter (monthly)
   ```

### Étape 3: Vérifier le Code Webhook

Le code du webhook est dans: `/app/api/webhooks/stripe/route.ts`

**Vérifications:**
- ✅ Gère `checkout.session.completed` (ligne 56-58)
- ✅ Gère `subscription.updated` (ligne 60-63)
- ✅ Détecte les upgrades (ligne 193)
- ✅ Reset les crédits sur upgrade (ligne 203)
- ✅ Logger les transactions (ligne 211-219)

**Tout le code est correct** - Le problème est uniquement la **configuration Stripe**.

---

## 📊 MAPPING DES PLANS

### Selon `/lib/stripe-config.ts`:

| Plan | Monthly | Yearly | Crédits/mois | Crédits/an |
|------|---------|--------|--------------|------------|
| **Starter** | $19.99 (1999¢) | $180.00 (18000¢) | 500 | 6,000 |
| **Professional** | $49.99 (4999¢) | $390.00 (39000¢) | 1,500 | 18,000 |
| **Enterprise** | $99.99 (9999¢) | $890.00 (89000¢) | 10,000 | 120,000 |

### Valeurs autorisées dans la DB:

Contrainte `valid_plan` (ligne 44 de `/supabase/migrations/20250117_payment_system.sql`):
```sql
CONSTRAINT valid_plan CHECK (plan_tier IN ('none', 'starter', 'professional', 'enterprise'))
```

⚠️ **IMPORTANT**: Utilisez `'professional'` (pas `'pro'`) et `'enterprise'` (pas `'business'`)

---

## 🔐 SÉCURITÉ

### Vérification de la signature Stripe

Le webhook vérifie automatiquement la signature (ligne 38-43):
```typescript
event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET!
);
```

✅ Cela garantit que seuls les webhooks authentiques de Stripe sont traités.

---

## ✅ CHECKLIST FINALE

- [x] Correction manuelle appliquée → Utilisateur a ses 500 crédits
- [ ] **Configurer le webhook Stripe dans le Dashboard**
- [ ] Copier le webhook secret dans `.env.local`
- [ ] Redéployer l'application
- [ ] Tester avec un paiement test
- [ ] Vérifier les logs du webhook
- [ ] Documenter l'URL webhook pour les futurs déploiements

---

## 🎯 PROCHAINES ÉTAPES

1. **URGENT**: Aller sur Stripe Dashboard et configurer le webhook
2. Tester avec un abonnement test
3. Une fois confirmé que ça fonctionne, supprimer `/scripts/fix-upgrade-manually.ts` (ne sera plus nécessaire)

---

**Dernière mise à jour**: 18 Novembre 2025
**Status**: ✅ Utilisateur débloqué - ⚠️ Configuration Stripe requise
