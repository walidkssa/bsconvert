# Fix user_id NOT NULL Constraint in Conversions Table

## Problème

La colonne `user_id` dans la table `conversions` est actuellement **nullable** (peut être NULL), ce qui pose plusieurs problèmes :

1. **Intégrité des données** : Des conversions peuvent exister sans utilisateur associé
2. **Requêtes inefficaces** : Les index ne peuvent pas être optimisés correctement
3. **Logique métier** : Chaque conversion devrait obligatoirement appartenir à un utilisateur
4. **Sécurité** : Les requêtes WHERE user_id ne sont pas fiables

## Solution

Rendre la colonne `user_id` **NOT NULL** pour garantir l'intégrité référentielle.

## Étapes de Migration

### 1️⃣ Vérifier les données existantes

Avant d'appliquer la contrainte, vérifiez s'il existe des conversions sans `user_id` :

```sql
SELECT
  id,
  file_name,
  created_at,
  user_id
FROM conversions
WHERE user_id IS NULL
ORDER BY created_at DESC
LIMIT 10;
```

**Résultat attendu** : Aucune ligne retournée (0 rows)

### 2️⃣ Nettoyer les données orphelines (si nécessaire)

Si des conversions avec `user_id = NULL` existent, vous avez 2 options :

**Option A : Supprimer les conversions orphelines** (recommandé si peu de données)

```sql
DELETE FROM conversions WHERE user_id IS NULL;
```

**Option B : Assigner à un utilisateur par défaut** (si vous voulez garder les données)

```sql
-- Créer un utilisateur "système" si nécessaire
-- Ensuite :
UPDATE conversions
SET user_id = 'ID_UTILISATEUR_SYSTEME'
WHERE user_id IS NULL;
```

### 3️⃣ Appliquer la contrainte NOT NULL

Une fois les données nettoyées :

```sql
ALTER TABLE conversions
ALTER COLUMN user_id SET NOT NULL;
```

### 4️⃣ Ajouter un commentaire de documentation

```sql
COMMENT ON COLUMN conversions.user_id IS 'User ID (required) - references auth.users';
```

### 5️⃣ Vérifier la contrainte

```sql
SELECT
  table_name,
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'conversions'
  AND column_name = 'user_id';
```

**Résultat attendu** : `is_nullable = 'NO'`

### 6️⃣ (Optionnel) Ajouter une Foreign Key

Pour renforcer l'intégrité référentielle :

```sql
ALTER TABLE conversions
ADD CONSTRAINT fk_conversions_user
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;
```

⚠️ **ATTENTION** : `ON DELETE CASCADE` supprimera toutes les conversions d'un utilisateur si son compte est supprimé. Utilisez `ON DELETE RESTRICT` si vous préférez empêcher la suppression.

## Script Complet pour Supabase Dashboard

Copiez-collez ce script dans **Supabase Dashboard > SQL Editor** :

```sql
-- ÉTAPE 1: Vérifier les conversions orphelines
SELECT COUNT(*) as orphaned_conversions
FROM conversions
WHERE user_id IS NULL;

-- ÉTAPE 2: Nettoyer (décommentez si nécessaire)
-- DELETE FROM conversions WHERE user_id IS NULL;

-- ÉTAPE 3: Appliquer NOT NULL
ALTER TABLE conversions
ALTER COLUMN user_id SET NOT NULL;

-- ÉTAPE 4: Documentation
COMMENT ON COLUMN conversions.user_id IS 'User ID (required) - references auth.users';

-- ÉTAPE 5: Vérification
SELECT
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'conversions'
  AND column_name = 'user_id';
```

## Impact sur l'Application

### Code Backend (APIs)

Tous les endpoints qui créent des conversions **doivent** maintenant fournir un `user_id` valide :

```typescript
// ✅ CORRECT - user_id fourni
const { data, error } = await supabase
  .from('conversions')
  .insert({
    user_id: user.id,  // OBLIGATOIRE
    file_name: 'statement.pdf',
    status: 'completed',
  });

// ❌ ERREUR - user_id manquant
const { data, error } = await supabase
  .from('conversions')
  .insert({
    // user_id manquant -> ERREUR !
    file_name: 'statement.pdf',
    status: 'completed',
  });
```

### APIs à vérifier

Vérifiez ces endpoints pour s'assurer qu'ils fournissent toujours `user_id` :

- ✅ `/api/process-pdf` - Vérifie déjà l'auth
- ✅ `/api/save-conversion` - Vérifie déjà l'auth
- ⚠️ Tout autre endpoint créant des conversions

## Tests après Migration

### Test 1 : Créer une conversion normale

```typescript
const { data: user } = await supabase.auth.getUser();
const { data, error } = await supabase
  .from('conversions')
  .insert({
    user_id: user.id,
    file_name: 'test.pdf',
    status: 'completed',
  });

// Devrait réussir
console.log(data, error);
```

### Test 2 : Tenter de créer une conversion sans user_id

```typescript
const { data, error } = await supabase
  .from('conversions')
  .insert({
    file_name: 'test.pdf',
    status: 'completed',
  });

// Devrait échouer avec une erreur
console.log(error); // "null value in column "user_id" violates not-null constraint"
```

## Rollback (si nécessaire)

Si vous devez annuler la migration :

```sql
-- Rendre user_id nullable à nouveau
ALTER TABLE conversions
ALTER COLUMN user_id DROP NOT NULL;
```

⚠️ **Non recommandé** : Cela réintroduit le problème d'intégrité des données.

## Performance

Cette migration n'affecte **pas** les performances :

- **Pas de modification de données** (juste contrainte)
- **Pas d'index à reconstruire**
- **Instantané** (< 1 seconde)
- **Pas de downtime** nécessaire

## Sécurité

Cette contrainte améliore la sécurité :

- ✅ Empêche les conversions anonymes non autorisées
- ✅ Garantit la traçabilité (chaque conversion a un propriétaire)
- ✅ Facilite les audits de sécurité
- ✅ Renforce la conformité RGPD (données liées aux utilisateurs)

## Questions Fréquentes

### Q : Que se passe-t-il si j'exécute la migration avec des user_id NULL ?

**R :** La migration **échouera** avec l'erreur :
```
ERROR: column "user_id" contains null values
```

Vous devez d'abord nettoyer les données (Étape 2).

### Q : Cette migration supprimera-t-elle des données ?

**R :** Non, sauf si vous exécutez explicitement `DELETE FROM conversions WHERE user_id IS NULL`.

### Q : Puis-je faire cette migration sans downtime ?

**R :** Oui, car il n'y a pas de reconstruction de table. Cependant, assurez-vous qu'aucune insertion sans `user_id` n'est en cours pendant la migration.

### Q : Faut-il ajouter la Foreign Key (Étape 6) ?

**R :** C'est **recommandé mais optionnel**. La Foreign Key garantit que le `user_id` référence un utilisateur existant, mais elle ajoute un petit overhead de performance sur les INSERT/DELETE.

## Fichiers Associés

- `scripts/fix-conversions-user-id.sql` - Script SQL complet
- `scripts/README-FIX-USER-ID.md` - Cette documentation
