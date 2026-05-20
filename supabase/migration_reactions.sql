-- Migration: reactions table (student feedback on AI messages)
-- Already applied to database (verified 2026-05-11)

CREATE TABLE IF NOT EXISTS reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    message_id UUID NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    professor_id UUID REFERENCES professeurs(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reactions_message ON reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_student ON reactions(student_id);
CREATE INDEX IF NOT EXISTS idx_reactions_professor ON reactions(professor_id);

ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reactions_backend_access" ON reactions FOR ALL USING (true);