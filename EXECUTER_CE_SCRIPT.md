# 🚨 IMPORTANT: Exécuter ce script SQL maintenant

## Problème actuel
Le trigger existe mais n'a pas les bonnes permissions pour créer des profils utilisateur.
Erreur: `PGRST116 - The result contains 0 rows`

## Solution: Exécuter le script SQL

### Étape 1: Aller sur Supabase Dashboard
1. Va sur: https://supabase.com/dashboard/project/silulzqcbmhypwpyggmo
2. Clique sur **SQL Editor** dans le menu de gauche

### Étape 2: Copier-coller le script
Copie TOUT le contenu du fichier `scripts/fix-trigger-permissions.sql` et colle-le dans l'éditeur SQL.

### Étape 3: Exécuter le script
Clique sur **Run** (ou Cmd+Enter)

## Ce que le script fait:

### 1. Recrée la fonction trigger avec les bonnes permissions
- Ajoute `SECURITY DEFINER` pour que la fonction s'exécute avec les permissions du créateur
- Ajoute la gestion d'erreurs
- Initialise les crédits à 0

### 2. Configure les RLS policies correctement
- Permet au service role de créer des profils
- Permet aux nouveaux utilisateurs de créer leur propre profil
- Garde la sécurité pour la lecture/modification

### 3. Vérifie que tout fonctionne
Le script affichera:
- Le trigger créé
- Les policies RLS configurées

## Après l'exécution

Une fois le script exécuté, tu DOIS aussi configurer les URLs Supabase:

### Configuration Authentication URLs (CRITIQUE)

1. Va sur: https://supabase.com/dashboard/project/silulzqcbmhypwpyggmo/auth/url-configuration

2. **Site URL**: Change de `http://localhost:3000` à:
   ```
   https://bsconvert.com
   ```

3. **Redirect URLs**: Ajoute ces URLs (clique "Add URL" pour chaque):
   ```
   https://bsconvert.com/**
   https://bsconvert.com/auth/callback
   https://bsconvert.com/dashboard
   ```

4. Clique **Save**

## Test final

Après avoir exécuté le script ET configuré les URLs:

1. Va sur https://bsconvert.com/signup
2. Crée un nouveau compte de test
3. Vérifie que tu es redirigé vers le dashboard
4. Vérifie qu'il n'y a plus d'erreur dans les logs

## Si ça ne marche toujours pas

Vérifie les logs Supabase:
1. Va sur: https://supabase.com/dashboard/project/silulzqcbmhypwpyggmo/logs/postgres-logs
2. Cherche des erreurs liées à `handle_new_user`
3. Envoie-moi les logs d'erreur
