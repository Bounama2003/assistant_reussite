-- ============================================
-- Migration: Add converted columns to leads table
-- ============================================
-- Ajouté le 2026-05-20 après le bug:
-- column leads.converted does not exist
-- Les colonnes converted et converted_at sont utilisées par:
--   - lead_service.py (filtre les leads convertis dans la liste admin)
--   - student_service.py (marque le lead comme converti lors de l'inscription)
--   - routes/stats.py (calcul du taux de conversion)
-- ============================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
