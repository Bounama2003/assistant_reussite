-- Rename matière to matiere in quiz_sessions
-- The column was created with an accent (matière) but the code
-- consistently uses "matiere" (no accent) everywhere.
ALTER TABLE quiz_sessions RENAME COLUMN matière TO matiere;
