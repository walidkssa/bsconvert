# ✅ Checklist Configuration Vercel Production

## Variables d'environnement à configurer sur Vercel

Va sur: https://vercel.com/[ton-username]/bsconvert/settings/environment-variables

### Variables CRITIQUES manquantes en production

Tu dois ajouter ces 2 variables en environnement **Production**:

#### 1. NEXT_PUBLIC_BASE_URL
- **Nom**: `NEXT_PUBLIC_BASE_URL`
- **Valeur**: `https://bsconvert.com`
- **Environnement**: Production ✅

#### 2. STRIPE_WEBHOOK_SECRET
- **Nom**: `STRIPE_WEBHOOK_SECRET`
- **Valeur**: `whsec_T9xNpIPTxOllKMJhiIMH6izlQRXQfDvc`
- **Environnement**: Production ✅

### Comment ajouter une variable:

1. Va sur Vercel Dashboard > Ton projet > Settings > Environment Variables
2. Clique sur "Add New"
3. Entre le nom de la variable
4. Entre la valeur
5. Sélectionne **Production** uniquement
6. Clique "Save"

### Redéploiement requis

Après avoir ajouté les variables:
1. Va sur l'onglet "Deployments"
2. Clique sur les "..." du dernier déploiement
3. Clique "Redeploy"
4. Attends que le déploiement soit terminé

## Variables déjà configurées (à vérifier)

Ces variables devraient déjà être sur Vercel. Vérifie qu'elles sont bien en **Production**:

### Supabase
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

### Stripe
- ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- ✅ `STRIPE_SECRET_KEY`
- ✅ `NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY`
- ✅ `NEXT_PUBLIC_STRIPE_PRICE_STARTER_YEARLY`
- ✅ `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY`
- ✅ `NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY`
- ✅ `NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY`
- ✅ `NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_YEARLY`

### Sécurité
- ✅ `IP_SALT`

### XAI (optionnel)
- ✅ `XAI_API_KEY`

## Test après configuration

Une fois les variables ajoutées et le site redéployé:

1. Va sur https://bsconvert.com
2. Ouvre la console développeur (F12)
3. Tape: `console.log(process.env.NEXT_PUBLIC_BASE_URL)`
4. Doit afficher: `https://bsconvert.com`

## Stripe Webhook Configuration

### Dans Stripe Dashboard:

1. Va sur: https://dashboard.stripe.com/webhooks
2. Trouve le webhook pour la production
3. L'endpoint doit être: `https://bsconvert.com/api/webhooks/stripe`
4. Le secret doit correspondre à celui que tu as mis dans Vercel

### Événements à surveiller:

Le webhook doit écouter ces événements:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## Billing Portal Stripe

1. Va sur: https://dashboard.stripe.com/settings/billing/portal
2. Clique "Activate live link"
3. **Return URL**: `https://bsconvert.com/dashboard/billing`
4. Active ces options:
   - ✅ Cancel subscriptions
   - ✅ Update subscriptions
   - ✅ Update payment methods

## Ordre d'exécution recommandé

1. ✅ Exécuter le script SQL (EXECUTER_CE_SCRIPT.md)
2. ✅ Configurer les URLs Supabase Auth
3. ✅ Ajouter les 2 variables Vercel manquantes
4. ✅ Redéployer sur Vercel
5. ✅ Configurer Stripe Billing Portal
6. ✅ Tester le flow complet d'inscription

## Après tout ça

Teste le flow complet:
1. Création de compte sur https://bsconvert.com/signup
2. Connexion
3. Voir le dashboard avec 0 crédits
4. Essayer de souscrire à un plan
5. Vérifier que le paiement fonctionne
6. Vérifier que les crédits sont bien ajoutés
