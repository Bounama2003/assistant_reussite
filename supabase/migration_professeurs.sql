-- Migration: professors table
-- Already applied to database (verified 2026-05-11)

CREATE TABLE IF NOT EXISTS professeurs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    matieres TEXT[] DEFAULT '{}',
    classes TEXT[] DEFAULT '{}',
    professor_key TEXT UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_professeurs_school ON professeurs(school_id);
CREATE INDEX IF NOT EXISTS idx_professeurs_phone ON professeurs(phone);

ALTER TABLE professeurs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "professeurs_backend_access" ON professeurs FOR ALL USING (true);