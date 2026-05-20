from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SchoolRead(BaseModel):
    id: str
    name: str
    logo_url: Optional[str] = None
    primary_color: str = "#2563EB"
    nom_directeur: Optional[str] = None
    directeur_fondateur: Optional[str] = None
    annee_scolaire_active: str = "2025-2026"
    is_suspended: bool = False


class SchoolAdminRead(BaseModel):
    id: str
    name: str
    logo_url: Optional[str] = None
    primary_color: str = "#2563EB"
    admin_key: str
    contact_email: Optional[str] = None
    nom_directeur: Optional[str] = None
    directeur_fondateur: Optional[str] = None
    annee_scolaire_active: str = "2025-2026"
    original_id: Optional[str] = None
    is_suspended: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    lead_count: int = 0
    document_count: int = 0


class SchoolCreate(BaseModel):
    id: str = Field(..., min_length=2, max_length=50, pattern=r"^[a-z0-9_]+$")
    name: str = Field(..., min_length=1, max_length=100)
    logo_url: Optional[str] = None
    primary_color: str = "#6366F1"
    contact_email: Optional[str] = None


class SchoolUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    contact_email: Optional[str] = None
    nom_directeur: Optional[str] = None
    directeur_fondateur: Optional[str] = None
    annee_scolaire_active: Optional[str] = None
    is_suspended: Optional[bool] = None


class LeadCreate(BaseModel):
    student_name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=13, max_length=13)
    serie: Optional[str] = None
    school_id: str


class LeadRead(BaseModel):
    id: str
    student_name: str
    phone: str
    serie: Optional[str] = None
    school_id: str
    created_at: datetime


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    school_id: str
    student_id: Optional[str] = None
    student_classe: Optional[str] = None
    student_name: Optional[str] = None
    session_id: Optional[str] = None
    conversation_history: Optional[list[dict]] = None


class Source(BaseModel):
    content: str
    metadata: dict
    score: Optional[float] = None


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source] = []
    message_id: Optional[str] = None


class UploadResponse(BaseModel):
    filename: str
    chunks_ingested: int
    school_id: str


class ErrorResponse(BaseModel):
    detail: str


class GlobalStats(BaseModel):
    total_schools: int
    total_leads: int
    total_documents: int
    schools: list[dict] = []


class StudentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=6, max_length=20)
    password: str = Field(..., min_length=4, max_length=50)
    serie: Optional[str] = None
    school_id: str


class StudentLogin(BaseModel):
    phone: str = Field(..., min_length=13, max_length=13)
    password: str = Field(..., min_length=4)
    school_id: str


class ConvertLeadRequest(BaseModel):
    classe: str
    password: str


class UpdateStudentRequest(BaseModel):
    classe: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None


class StudentRead(BaseModel):
    id: str
    name: str
    phone: str
    serie: Optional[str] = None
    classe: Optional[str] = None
    school_id: str
    is_active: bool = True


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)


class UploadRequest(BaseModel):
    school_id: str
    matiere: str = Field(..., min_length=1, max_length=100)
    classe: str = Field(..., min_length=1, max_length=20)
    professeur: Optional[str] = None
    annee_scolaire: str = "2025-2026"


class ChatSessionCreate(BaseModel):
    school_id: str
    title: Optional[str] = None


class ChatSessionRead(BaseModel):
    id: str
    student_id: Optional[str] = None
    school_id: str
    title: str
    is_active: bool = True


class ChatMessageRead(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    sources: list = []


# ============================================
# Quiz schemas
# ============================================

class QuizCreate(BaseModel):
    student_id: str
    school_id: str
    matiere: Optional[str] = None
    classe: Optional[str] = None
    question_count: int = Field(default=5, ge=3, le=15)


class QuizQuestion(BaseModel):
    id: str
    session_id: str
    question_number: int
    question_text: str
    options: list[str]
    answered: bool = False
    student_answer: Optional[int] = None
    is_correct: Optional[bool] = None
    explanation: Optional[str] = None
    source_doc_filename: Optional[str] = None


class QuizSessionRead(BaseModel):
    id: str
    student_id: str
    school_id: str
    title: str
    matiere: Optional[str] = None
    classe: Optional[str] = None
    total_questions: int
    answered_count: int
    score: int
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    questions: list[QuizQuestion] = []


class QuizAnswerRequest(BaseModel):
    question_id: str
    answer: int = Field(..., ge=0, le=3)


class QuizAnswerResponse(BaseModel):
    question_id: str
    is_correct: bool
    correct_answer: int
    explanation: str
    score: float
    quiz_completed: bool


class QuizResult(BaseModel):
    session_id: str
    total_questions: int
    correct_answers: int
    score: float
    status: str
    recommendations: list[str]


class QuizStartResponse(BaseModel):
    session_id: str
    title: str
    questions: list[QuizQuestion]
    total: int


# ============================================
# Professor schemas
# ============================================

class ProfessorCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=9, max_length=20)
    matieres: list[str] = []
    classes: list[str] = []
    school_id: str


class ProfessorLogin(BaseModel):
    phone: str = Field(..., min_length=9, max_length=20)
    password: str = Field(..., min_length=4)
    school_id: str


class ProfessorKeyLogin(BaseModel):
    professor_key: str = Field(..., min_length=1)
    school_id: str


class ProfessorKeyResponse(BaseModel):
    professor_key: str
    name: str


class ProfessorRead(BaseModel):
    id: str
    school_id: str
    name: str
    phone: str
    matieres: list[str] = []
    classes: list[str] = []
    professor_key: str = ""
    is_active: bool = True
    created_at: Optional[datetime] = None


class ProfessorStatsRead(BaseModel):
    professor_id: str
    school_id: str
    total_questions: int = 0
    avg_rating: Optional[float] = None
    thumbs_up: int = 0
    thumbs_down: int = 0
    last_updated: Optional[datetime] = None


# ============================================
# Reaction schemas
# ============================================

class ReactionCreate(BaseModel):
    message_id: str
    session_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class ReactionRead(BaseModel):
    id: str
    message_id: str
    session_id: str
    student_id: Optional[str] = None
    professor_id: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    created_at: Optional[datetime] = None


# ============================================
# Professor dashboard schemas
# ============================================

class ProfessorDocumentStat(BaseModel):
    filename: str
    matiere: str
    classe: str
    query_count: int = 0
    thumbs_up: int = 0
    thumbs_down: int = 0
    avg_rating: Optional[float] = None


class ProfessorQuestionSummary(BaseModel):
    session_id: str
    student_name: str
    question_preview: str
    matiere: str
    classe: str
    timestamp: Optional[datetime] = None


# ============================================
# School config schemas
# ============================================

class SchoolLevelCreate(BaseModel):
    nom_niveau: str = Field(..., min_length=1, max_length=100)

class SchoolLevelRead(BaseModel):
    id: str
    school_id: str
    nom_niveau: str
    created_at: Optional[datetime] = None

class SchoolClassCreate(BaseModel):
    nom_classe: str = Field(..., min_length=1, max_length=100)
    professeur_responsable: Optional[str] = None  # UUID of professor

class SchoolClassRead(BaseModel):
    id: str
    school_id: str
    nom_classe: str
    professeur_responsable: Optional[str] = None
    professeur_nom: Optional[str] = None
    created_at: Optional[datetime] = None

class SchoolCourseCreate(BaseModel):
    nom_cours: str = Field(..., min_length=1, max_length=100)
    libelle: Optional[str] = None

class SchoolCourseRead(BaseModel):
    id: str
    school_id: str
    nom_cours: str
    libelle: Optional[str] = None
    created_at: Optional[datetime] = None
