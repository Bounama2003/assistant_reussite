// ============================================================
// School & Lead
// ============================================================
export interface School {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  nom_directeur: string | null;
  directeur_fondateur: string | null;
  annee_scolaire_active: string;
  is_suspended: boolean;
}

export interface SchoolAdmin extends School {
  admin_key: string;
  contact_email: string | null;
  original_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  lead_count: number;
  document_count: number;
}

export interface SchoolCreate {
  id: string;
  name: string;
  logo_url?: string | null;
  primary_color?: string;
  contact_email?: string | null;
}

export interface SchoolUpdate {
  name?: string;
  logo_url?: string | null;
  primary_color?: string;
  contact_email?: string | null;
  nom_directeur?: string | null;
  directeur_fondateur?: string | null;
  annee_scolaire_active?: string;
  is_suspended?: boolean;
}

export interface LeadCreate {
  student_name: string;
  phone: string;
  serie?: string | null;
  school_id: string;
}

export interface Lead {
  id: string;
  student_name: string;
  phone: string;
  serie: string | null;
  classe: string | null;
  school_id: string;
  created_at: string;
}

// ============================================================
// Student
// ============================================================
export interface StudentLogin {
  phone: string;
  password: string;
  school_id: string;
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  serie: string | null;
  classe: string | null;
  school_id: string;
  is_active: boolean;
}

export interface ConvertLeadRequest {
  classe: string;
  password: string;
}

export interface UpdateStudentRequest {
  classe?: string | null;
  password?: string | null;
  is_active?: boolean | null;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// ============================================================
// Chat
// ============================================================
export interface ChatRequest {
  question: string;
  school_id: string;
  student_id?: string | null;
  student_classe?: string | null;
  student_name?: string | null;
  session_id?: string | null;
  conversation_history?: Array<{ role: string; content: string }> | null;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
  message_id: string | null;
}

export interface Source {
  content: string;
  metadata: Record<string, unknown>;
  score?: number | null;
}

export interface ChatSession {
  id: string;
  student_id: string | null;
  school_id: string;
  title: string;
  is_active: boolean;
  created_at?: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: string;
  content: string;
  sources: unknown[];
  created_at?: string;
}

// ============================================================
// Quiz
// ============================================================
export interface QuizCreate {
  student_id: string;
  school_id: string;
  matiere?: string | null;
  classe?: string | null;
  question_count?: number;
}

export interface QuizQuestion {
  id: string;
  session_id: string;
  question_number: number;
  question_text: string;
  options: string[];
  answered: boolean;
  student_answer: number | null;
  is_correct: boolean | null;
  explanation: string | null;
  source_doc_filename: string | null;
  source_doc_matiere?: string;
  chapter?: string;
}

export interface QuizSession {
  id: string;
  student_id: string;
  school_id: string;
  title: string;
  matiere: string | null;
  classe: string | null;
  total_questions: number;
  answered_count: number;
  score: number;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  questions: QuizQuestion[];
}

export interface QuizStartResponse {
  session_id: string;
  title: string;
  questions: QuizQuestion[];
  total: number;
}

export interface QuizAnswerRequest {
  question_id: string;
  answer: number;
}

export interface QuizAnswerResponse {
  question_id: string;
  is_correct: boolean;
  correct_answer: number;
  explanation: string;
  score: number;
  quiz_completed: boolean;
}

export interface QuizResult {
  session_id: string;
  total_questions: number;
  correct_answers: number;
  score: number;
  status: string;
  recommendations: string[];
}

export interface QuizSummary {
  id: string;
  title: string;
  matiere: string | null;
  classe: string | null;
  total_questions: number;
  answered_count: number;
  score: number;
  status: string;
  started_at: string | null;
  completed_at: string | null;
}

// ============================================================
// Professor
// ============================================================
export interface ProfessorCreate {
  name: string;
  phone: string;
  matieres: string[];
  classes: string[];
  school_id: string;
}

export interface ProfessorLogin {
  phone: string;
  password: string;
  school_id: string;
}

export interface ProfessorKeyLogin {
  professor_key: string;
  school_id: string;
}

export interface Professor {
  id: string;
  school_id: string;
  name: string;
  phone: string;
  matieres: string[];
  classes: string[];
  professor_key: string;
  is_active: boolean;
  created_at: string | null;
}

export interface ProfessorStats {
  professor_id: string;
  school_id: string;
  total_questions: number;
  avg_rating: number | null;
  thumbs_up: number;
  thumbs_down: number;
  last_updated: string | null;
}

export interface ProfessorDocumentStat {
  filename: string;
  matiere: string;
  classe: string;
  query_count: number;
  thumbs_up: number;
  thumbs_down: number;
  avg_rating: number | null;
}

export interface ProfessorQuestionSummary {
  session_id: string;
  student_name: string;
  question_preview: string;
  matiere: string;
  classe: string;
  timestamp: string | null;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string | null;
}

// ============================================================
// Reactions
// ============================================================
export interface ReactionCreate {
  message_id: string;
  session_id: string;
  rating: number;
  comment?: string | null;
}

export interface Reaction {
  id: string;
  message_id: string;
  session_id: string;
  student_id: string | null;
  professor_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string | null;
}

// ============================================================
// Documents & Upload
// ============================================================
export interface UploadResponse {
  filename: string;
  chunks_ingested: number;
  school_id: string;
}

export interface DocumentItem {
  filename: string;
  matiere: string;
  classe: string;
  professeur: string;
  annee_scolaire: string;
  public: boolean;
  chunks: number;
}

export interface SchoolLevel {
  id: string;
  school_id: string;
  nom_niveau: string;
  created_at: string | null;
}

export interface SchoolClass {
  id: string;
  school_id: string;
  nom_classe: string;
  professeur_responsable: string | null;
  professeur_nom: string | null;
  created_at: string | null;
}

export interface SchoolCourse {
  id: string;
  school_id: string;
  nom_cours: string;
  libelle: string | null;
  created_at: string | null;
}

// ============================================================
// Stats
// ============================================================
export interface SchoolStats {
  school_id: string;
  leads: {
    by_day: Record<string, number>;
    by_serie: Record<string, number>;
    total: number;
    total_all?: number;
    converted?: number;
    conversion_rate?: number;
  };
  documents: {
    by_matiere: Record<string, number>;
    total_chunks: number;
    total_files: number;
  };
  chats: {
    total_sessions: number;
    total_messages: number;
    messages_by_day: Record<string, number>;
    heatmap?: Record<string, Record<string, number>>;
  };
}

export interface GlobalStats {
  total_schools: number;
  total_leads: number;
  total_documents: number;
  schools: Array<{
    id: string;
    name: string;
    primary_color: string;
    lead_count: number;
    document_count: number;
    is_suspended: boolean;
  }>;
}

// ============================================================
// Exports
// ============================================================
export interface ExportLeadsExcel {
  school_id: string;
  admin_key: string;
}

export interface ExportStudentsExcel {
  school_id: string;
  admin_key: string;
}
