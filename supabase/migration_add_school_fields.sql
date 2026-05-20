-- Migration: Add new school fields and update document metadata support
-- Execute this in Supabase SQL Editor for existing projects

-- 1. Add new columns to schools table
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS nom_directeur TEXT,
ADD COLUMN IF NOT EXISTS directeur_fondateur TEXT,
ADD COLUMN IF NOT EXISTS annee_scolaire_active TEXT DEFAULT '2025-2026';

-- 2. Update existing test data with example values (optional, remove if not needed)
UPDATE schools 
SET 
    nom_directeur = 'M. Amadou Diallo',
    directeur_fondateur = 'M. Mamadou Fall',
    annee_scolaire_active = '2025-2026'
WHERE id = 'upeps_01';

UPDATE schools 
SET 
    nom_directeur = 'Mme. Fatou Sow',
    directeur_fondateur = 'M. Cheikh Diop',
    annee_scolaire_active = '2025-2026'
WHERE id = 'demo_ecole';

-- 3. No changes needed to documents table (metadata is JSONB, supports new fields natively)
-- 4. Update students table to align classe options (optional: add check constraint)
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS classe TEXT;  -- Nouvelle colonne pour la classe exacte (3e, TL1, etc.)

-- Migrate existing serie values to classe (optional)
UPDATE students 
SET classe = CASE 
    WHEN serie = 'TS' THEN 'TS1'
    WHEN serie = 'TL' THEN 'TL1'
    WHEN serie = '3ème' THEN '3e'
    ELSE NULL
END
WHERE classe IS NULL;

-- Classe validation is delegated to per-school configuration in the application layer
-- rather than a hardcoded CHECK constraint. Schools define their own class names freely.
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS classe TEXT;
