-- ============================================
-- Assistant Réussite - Clean Migration Script
-- DROP ALL + RECREATE FROM SCRATCH
-- Execute this in Supabase SQL Editor
-- ============================================

-- Drop existing tables (in correct order due to FK constraints)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS schools CASCADE;

-- Drop existing extensions (optional, comment if you want to keep)
-- DROP EXTENSION IF EXISTS vector CASCADE;

-- ============================================
-- Extension PGVector
-- ============================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- Table: schools
-- ============================================
CREATE TABLE schools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#2563EB',
    admin_key TEXT UNIQUE,
    contact_email TEXT,
    nom_directeur TEXT,               -- Directeur actuel de l'école
    directeur_fondateur TEXT,          -- Directeur fondateur de l'école
    annee_scolaire_active TEXT DEFAULT '2025-2026',  -- Année scolaire active par défaut
    is_suspended BOOLEAN DEFAULT false, -- École suspendue ou non
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_schools_name ON schools(name);

-- ============================================
-- Table: documents (vecteurs RAG)
-- ============================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,            -- Texte chunké du document
    embedding vector(384),           -- Vecteur d'embedding (BGE-small = 384 dims)
    metadata JSONB NOT NULL DEFAULT '{}',  -- {school_id, matiere, classe, filename, page, professeur, annee_scolaire}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche vectorielle + filtrage metadata
CREATE INDEX idx_documents_embedding ON documents USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_documents_school_id ON documents USING GIN (metadata);

-- ============================================
-- Table: students (élèves avec mot de passe)
-- ============================================
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    serie TEXT,                       -- ex: "TS", "TL", "3ème"
    classe TEXT,                      -- ex: "3e", "TL1", "TS2"
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_students_school_id ON students(school_id);
CREATE INDEX idx_students_phone ON students(phone);

-- ============================================
-- Table: leads (inscriptions élèves)
-- ============================================
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,       -- Contrainte UNIQUE sur le téléphone
    serie TEXT,                       -- ex: "S", "L", "ES"
    classe TEXT,                      -- ex: "3e", "TL1", "TS2"
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_school_id ON leads(school_id);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- ============================================
-- Table: chat_sessions (sessions de chat)
-- ============================================
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Nouvelle conversation',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_student ON chat_sessions(student_id);
CREATE INDEX idx_chat_sessions_school ON chat_sessions(school_id);

-- ============================================
-- Table: chat_messages (messages dans les sessions)
-- ============================================
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    sources JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);

-- ============================================
-- RLS Policies (Row Level Security)
-- ============================================

-- Schools: lecture publique (nécessaire pour le branding dynamique)
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schools_public_read" ON schools FOR SELECT USING (true);

-- Documents: lecture via service key uniquement (backend)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documents_backend_access" ON documents FOR ALL USING (true);

-- Students: lecture/écriture via service key (backend)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students_backend_access" ON students FOR ALL USING (true);

-- Leads: lecture via service key uniquement (backend + admin)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_backend_access" ON leads FOR ALL USING (true);

-- Chat sessions: lecture/écriture via service key (backend)
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_sessions_backend_access" ON chat_sessions FOR ALL USING (true);

-- Chat messages: lecture/écriture via service key (backend)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_messages_backend_access" ON chat_messages FOR ALL USING (true);

-- ============================================
-- Données de test
-- ============================================
INSERT INTO schools (id, name, primary_color, admin_key, nom_directeur, directeur_fondateur, annee_scolaire_active) VALUES
    ('demo_ecole', 'École Démo', '#6366F1', 'admin-demo_ecole-change-me', 'Mme. Fatou Sow', 'M. Cheikh Diop', '2025-2026'),
    ('upeps_01', 'UPEPS', '#1E40AF', 'admin-upeps_01-change-me', 'M. Amadou Diallo', 'M. Mamadou Fall', '2025-2026')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Bucket pour les logos (optionnel)
-- ============================================
-- À créer via le dashboard Supabase ou décommenter:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

-- ============================================
-- FIN DU SCRIPT
-- ============================================
