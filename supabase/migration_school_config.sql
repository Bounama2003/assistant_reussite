-- Migration: School config tables (classes, levels, courses) + public document flag
-- Execute in Supabase SQL Editor

-- ============================================
-- Table: school_levels (niveaux configurables par école)
-- ============================================
CREATE TABLE IF NOT EXISTS school_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    nom_niveau TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, nom_niveau)
);

CREATE INDEX IF NOT EXISTS idx_school_levels_school ON school_levels(school_id);

-- ============================================
-- Table: school_classes (classes configurables par école)
-- ============================================
CREATE TABLE IF NOT EXISTS school_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    nom_classe TEXT NOT NULL,
    professeur_responsable UUID REFERENCES professeurs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, nom_classe)
);

CREATE INDEX IF NOT EXISTS idx_school_classes_school ON school_classes(school_id);

-- ============================================
-- Table: school_courses (cours/matières configurables par école)
-- ============================================
CREATE TABLE IF NOT EXISTS school_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    nom_cours TEXT NOT NULL,
    libelle TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, nom_cours)
);

CREATE INDEX IF NOT EXISTS idx_school_courses_school ON school_courses(school_id);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE school_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "school_levels_backend_access" ON school_levels FOR ALL USING (true);

ALTER TABLE school_classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "school_classes_backend_access" ON school_classes FOR ALL USING (true);

ALTER TABLE school_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "school_courses_backend_access" ON school_courses FOR ALL USING (true);
