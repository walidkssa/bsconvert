# 🚀 Configuration Production BS Convert - Plan d'Action

## ❌ Problème actuel

L'inscription ne fonctionne pas en production avec l'erreur:
```
Profile was not created by trigger: PGRST116 - The result contains 0 rows
```

## 🔍 Diagnostic

Le trigger PostgreSQL existe mais n'a pas les bonnes permissions pour créer des profils utilisateur quand un nouvel utilisateur s'inscrit.

## ✅ Solution: 5 étapes à suivre DANS L'ORDRE

### 📋 Étape 1: Exécuter le script SQL sur Supabase

**Fichier**: [scripts/fix-trigger-permissions.sql](scripts/fix-trigger-permissions.sql)

**Instructions détaillées**: [EXECUTER_CE_SCRIPT.md](EXECUTER_CE_SCRIPT.md)

**Action rapide**:
1. Va sur https://supabase.com/dashboard/project/silulzqcbmhypwpyggmo/sql
2. Copie-colle tout le contenu de `scripts/fix-trigger-permissions.sql`
3. Clique "Run"
4. Vérifie qu'il n'y a pas d'erreur

**Ce que ça fait**:
- Recrée le trigger avec `SECURITY DEFINER` (permissions correctes)
- Configure les RLS policies pour permettre la création de profils
- Ajoute la gestion d'erreurs au trigger
- Initialise les crédits à 0 pour les nouveaux utilisateurs

---

### 🔗 Étape 2: Configurer les URLs Supabase Auth

**Lien direct**: https://supabase.com/dashboard/project/silulzqcbmhypwpyggmo/auth/url-configuration

**À configurer**:

1. **Site URL**:
   - Remplacer `http://localhost:3000`
   - Par: `https://bsconvert.com`

2. **Redirect URLs** (ajouter ces 3 URLs):
   ```
   https://bsconvert.com/**
   https://bsconvert.com/auth/callback
   https://bsconvert.com/dashboard
   ```

3. Cliquer **Save**

**Pourquoi c'est critique**: Sans ça, les emails de confirmation redirigeront vers localhost et les utilisateurs ne pourront pas confirmer leur compte.

---

### ⚙️ Étape 3: Configurer les variables Vercel

**Fichier de référence**: [VERCEL_CONFIG_CHECKLIST.md](VERCEL_CONFIG_CHECKLIST.md)

**Action**: Va sur https://vercel.com/[ton-username]/bsconvert/settings/environment-variables

**2 variables MANQUANTES à ajouter en Production**:

#### Variable 1: NEXT_PUBLIC_BASE_URL
- **Nom**: `NEXT_PUBLIC_BASE_URL`
- **Valeur**: `https://bsconvert.com`
- **Environnement**: ✅ Production uniquement

#### Variable 2: STRIPE_WEBHOOK_SECRET
- **Nom**: `STRIPE_WEBHOOK_SECRET`
- **Valeur**: `whsec_T9xNpIPTxOllKMJhiIMH6izlQRXQfDvc`
- **Environnement**: ✅ Production uniquement

**Après avoir ajouté les variables**:
1. Va sur l'onglet "Deployments"
2. Clique "..." du dernier déploiement
3. Clique "Redeploy"
4. Attends la fin du déploiement

---

### 💳 Étape 4: Configurer Stripe Billing Portal

**Lien direct**: https://dashboard.stripe.com/settings/billing/portal

**À faire**:
1. Clique "Activate live link"
2. **Return URL**: `https://bsconvert.com/dashboard/billing`
3. Active ces options:
   - ✅ Cancel subscriptions
   - ✅ Update subscriptions
   - ✅ Update payment methods
4. Clique **Save**

**Vérifier aussi le webhook**:
- Lien: https://dashboard.stripe.com/webhooks
- L'endpoint doit être: `https://bsconvert.com/api/webhooks/stripe`
- Le secret doit correspondre à: `whsec_T9xNpIPTxOllKMJhiIMH6izlQRXQfDvc`

---

### 🧪 Étape 5: Tester le flow complet

**Ordre des tests**:

1. **Test inscription**:
   - Va sur https://bsconvert.com/signup
   - Crée un nouveau compte de test (utilise un vrai email)
   - Vérifie que tu reçois l'email de confirmation
   - Vérifie que l'email pointe vers bsconvert.com (PAS localhost)
   - Confirme l'email
   - Vérifie que tu arrives sur le dashboard

2. **Test profil créé**:
   - Va sur Supabase Dashboard > Table Editor > user_profiles
   - Vérifie que ton profil existe
   - Vérifie que `credits = 0`
   - Vérifie que `plan_tier = 'none'`

3. **Test souscription**:
   - Essaye de souscrire à un plan
   - Utilise une carte de test Stripe: `4242 4242 4242 4242`
   - Vérifie que le paiement passe
   - Vérifie que les crédits sont ajoutés

4. **Test conversion**:
   - Upload un fichier bancaire
   - Lance une conversion
   - Vérifie que les crédits sont déduits
   - Vérifie que tu peux télécharger le résultat

---

## 📝 Résumé des fichiers créés

| Fichier | Description |
|---------|-------------|
| [scripts/fix-trigger-permissions.sql](scripts/fix-trigger-permissions.sql) | Script SQL à exécuter sur Supabase |
| [EXECUTER_CE_SCRIPT.md](EXECUTER_CE_SCRIPT.md) | Instructions détaillées pour le SQL |
| [VERCEL_CONFIG_CHECKLIST.md](VERCEL_CONFIG_CHECKLIST.md) | Checklist variables Vercel |
| [.env.local](.env.local) | Déjà mis à jour avec `NEXT_PUBLIC_BASE_URL` et `STRIPE_WEBHOOK_SECRET` |
| [app/privacy/page.tsx](app/privacy/page.tsx) | Email mis à jour: bsconvert.contact@gmail.com ✅ |

---

## 🆘 En cas de problème

### Le trigger ne s'exécute toujours pas
1. Vérifie les logs Postgres: https://supabase.com/dashboard/project/silulzqcbmhypwpyggmo/logs/postgres-logs
2. Cherche "handle_new_user" dans les logs
3. Envoie-moi les erreurs exactes

### L'email de confirmation pointe vers localhost
1. Vérifie que tu as bien configuré les URLs Supabase (Étape 2)
2. Vérifie que la Site URL est `https://bsconvert.com`
3. Attends 5 minutes que Supabase propage les changements

### Les variables Vercel ne sont pas prises en compte
1. Vérifie qu'elles sont en environnement "Production"
2. Force un redéploiement
3. Vide le cache du navigateur (Cmd+Shift+R)

### Le paiement Stripe ne fonctionne pas
1. Vérifie que le webhook est configuré
2. Vérifie que le webhook secret correspond
3. Va sur Stripe Dashboard > Webhooks > Clique sur ton webhook > Onglet "Recent events"
4. Cherche des erreurs

---

## 🎯 Checklist finale

- [ ] Script SQL exécuté sur Supabase
- [ ] URLs Supabase Auth configurées
- [ ] Variables Vercel ajoutées
- [ ] Site redéployé sur Vercel
- [ ] Stripe Billing Portal activé
- [ ] Test inscription OK
- [ ] Test profil créé OK
- [ ] Test souscription OK
- [ ] Test conversion OK

Une fois TOUT coché, ton site est 100% prêt pour la production! 🎉

---

## 📧 Contact

Si tu as des questions ou des problèmes, envoie-moi:
- Les logs d'erreur complets
- Les screenshots des configurations
- L'étape où tu bloques

On va régler ça ensemble! 💪
