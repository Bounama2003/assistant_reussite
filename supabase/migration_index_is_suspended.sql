-- Migration: Ajout d'un index sur schools.is_suspended
-- Les requêtes de vérification de suspension sont fréquentes sur tous les endpoints

CREATE INDEX IF NOT EXISTS idx_schools_is_suspended ON schools(is_suspended);
