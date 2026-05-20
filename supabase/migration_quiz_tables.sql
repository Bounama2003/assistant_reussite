DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS quiz_sessions CASCADE;

CREATE TABLE quiz_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    title TEXT,
    matiere TEXT,
    classe TEXT,
    total_questions INTEGER DEFAULT 0,
    answered_count INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_quiz_sessions_student ON quiz_sessions(student_id);
CREATE INDEX idx_quiz_sessions_school ON quiz_sessions(school_id);
CREATE INDEX idx_quiz_sessions_status ON quiz_sessions(status);

CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer INTEGER NOT NULL,
    explanation TEXT,
    student_answer INTEGER,
    is_correct BOOLEAN,
    answered_at TIMESTAMPTZ,
    source_doc_filename TEXT,
    source_doc_matiere TEXT,
    chapter TEXT
);

CREATE INDEX idx_quiz_questions_session ON quiz_questions(session_id);
CREATE INDEX idx_quiz_questions_number ON quiz_questions(session_id, question_number);

ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz_sessions_backend_access" ON quiz_sessions FOR ALL USING (true);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz_questions_backend_access" ON quiz_questions FOR ALL USING (true);
