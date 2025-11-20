# ⚡ Quick Start - Système de Paiement BS Convert

Guide ultra-rapide pour démarrer (5 minutes)

---

## 🚀 DÉMARRAGE RAPIDE

### 1️⃣ Installer les dépendances (30 secondes)

```bash
npm install stripe @stripe/stripe-js pdf-parse
npm install -D tsx
```

---

### 2️⃣ Déployer la base de données (2 minutes)

1. **Ouvrir Supabase Dashboard**: https://supabase.com/dashboard
2. **Aller dans SQL Editor**
3. **Copier TOUT** le contenu de: `supabase/migrations/20250117_payment_system.sql`
4. **Coller dans SQL Editor** et cliquer **Run**

**Vérification rapide**:
```sql
SELECT COUNT(*) FROM user_profiles;
```
Si ça retourne 0 ou plus → ✅ Succès

---

### 3️⃣ Configurer Stripe (2 minutes)

1. **Aller sur Stripe**: https://dashboard.stripe.com/test/apikeys
2. **Copier les 2 clés** (Publishable + Secret)
3. **Éditer `.env.local`**:

```bash
# Ajouter ces lignes
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

4. **Générer salt IP**:
```bash
openssl rand -base64 32
```
Ajouter le résultat dans `.env.local`:
```bash
IP_SALT=VOTRE_SALT
```

---

### 4️⃣ Créer les products Stripe (30 secondes)

```bash
npx tsx scripts/setup-stripe-products.ts
```

**Copier les 6 Price IDs** affichés et les ajouter dans `.env.local`:

```bash
NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_STARTER_YEARLY=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_YEARLY=price_xxxxx
```

---

### 5️⃣ Démarrer l'app (10 secondes)

**Terminal 1** (serveur):
```bash
npm run dev
```

**Terminal 2** (webhooks - optionnel pour dev):
```bash
# Installer Stripe CLI d'abord si pas fait:
# macOS: brew install stripe/stripe-cli/stripe

stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copier le `whsec_xxxxx` affiché et l'ajouter dans `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

**Redémarrer le serveur** (Ctrl+C puis `npm run dev`)

---

## ✅ VÉRIFICATION

Ouvrir http://localhost:3000/landing

Si ça charge → **Tout est prêt !** 🎉

---

## 📋 FICHIER .ENV.LOCAL COMPLET

Voici à quoi doit ressembler ton `.env.local`:

```bash
# Supabase (déjà existant)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx

# Grok AI (déjà existant)
XAI_API_KEY=xai-xxx

# Stripe (NOUVEAU)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Stripe Price IDs (NOUVEAU)
NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_STARTER_YEARLY=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_YEARLY=price_xxxxx

# App (NOUVEAU)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
IP_SALT=xxxxx
```

---

## 🎯 PROCHAINE ÉTAPE

Une fois tout configuré, dis-moi et on code les API routes !

---

## 🆘 PROBLÈME ?

- **Migration échoue**: Vérifie qu'il n'y a pas d'erreur SQL dans la console Supabase
- **Script Stripe échoue**: Vérifie que `STRIPE_SECRET_KEY` est bien dans `.env.local`
- **Serveur crash**: Vérifie que toutes les variables d'env sont présentes
- **Webhooks ne marchent pas**: Normal pour l'instant, on n'a pas encore codé les API routes

---

**Total temps**: ~5 minutes ⚡
