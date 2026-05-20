-- Migration: Drop classe CHECK constraints
-- These constraints hardcode specific class names ('3e', 'TL1', 'TS2', 'TS1', 'TL2')
-- which prevents schools from using their own class names.
-- Validation is handled at the application layer via per-school class configuration.

DROP CONSTRAINT IF EXISTS check_valid_classe ON students;
DROP CONSTRAINT IF EXISTS check_valid_lead_classe ON leads;
