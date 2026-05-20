-- Exécuter dans l'éditeur SQL de Supabase APRÈS le schema initial

ALTER TABLE schools ADD COLUMN IF NOT EXISTS admin_key TEXT UNIQUE;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS contact_email TEXT;

UPDATE schools SET admin_key = 'admin-' || id || '-' || substr(md5(random()::text), 1, 12) WHERE admin_key IS NULL;
