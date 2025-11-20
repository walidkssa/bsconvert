-- Désactiver la confirmation email obligatoire
-- Les utilisateurs pourront se connecter immédiatement après inscription

-- Note: Cette configuration doit aussi être faite dans le dashboard Supabase
-- Aller sur: Authentication > Providers > Email
-- Et décocher "Confirm email"

-- Pour vérifier la configuration actuelle:
SELECT
  name,
  raw_base_config->'MAILER_AUTOCONFIRM' as autoconfirm_setting
FROM auth.config;

-- Si tu veux forcer l'auto-confirmation pour tous les nouveaux utilisateurs,
-- tu peux aussi confirmer manuellement les emails existants:
-- UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;
