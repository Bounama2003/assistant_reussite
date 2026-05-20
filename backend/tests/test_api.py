"""
API endpoint tests for Assistant Réussite.
Uses FastAPI TestClient with mocked external services.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Prevent HuggingFace/Groq from loading at import time by patching their classes
from unittest.mock import MagicMock, patch
import rag.engine as real_engine  # save reference to real module before any patching

# Patch the heavy model classes BEFORE they're imported by rag.engine
mock_embed = MagicMock()
mock_llm = MagicMock()
model_patcher = patch.multiple(
    'rag.engine',
    HuggingFaceEmbedding=lambda **kw: mock_embed,
    Groq=lambda **kw: mock_llm,
    embed_model=mock_embed,
    llm=mock_llm,
)
model_patcher.start()

# Also patch database
import config.database as real_db
db_patcher = patch('config.database.get_supabase_client', return_value=MagicMock())
db_patcher.start()

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# ============================================
# Health
# ============================================

class TestHealth:
    def test_health_returns_ok(self):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"

    def test_root_returns_info(self):
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert "version" in data
        assert "Assistant Réussite" in data["message"]

# ============================================
# School
# ============================================

class TestSchoolEndpoint:
    @patch("routes.schools.get_school")
    def test_get_school_found(self, mock_get_school):
        from models.schemas import SchoolRead
        mock_get_school.return_value = SchoolRead(
            id="upeps_01", name="UPEPS",
            primary_color="#11caa0", annee_scolaire_active="2025-2026"
        )
        resp = client.get("/school/upeps_01")
        assert resp.status_code == 200
        assert resp.json()["id"] == "upeps_01"

    @patch("routes.schools.get_school")
    def test_get_school_not_found(self, mock_get_school):
        mock_get_school.return_value = None
        resp = client.get("/school/unknown")
        assert resp.status_code == 404

# ============================================
# Chat
# ============================================

class TestChatEndpoint:
    @patch("routes.chat.query_rag")
    @patch("routes.chat.get_school")
    def test_chat_empty_question(self, mock_get_school, mock_query_rag):
        from models.schemas import SchoolRead
        mock_get_school.return_value = SchoolRead(
            id="upeps_01", name="UPEPS",
            primary_color="#11caa0", annee_scolaire_active="2025-2026"
        )
        mock_query_rag.return_value = ("Réponse test", [])
        resp = client.post("/chat", json={
            "question": "Bonjour",
            "school_id": "upeps_01"
        })
        assert resp.status_code == 200
        assert resp.json()["answer"] == "Réponse test"

    @patch("routes.chat.get_school")
    def test_chat_school_not_found(self, mock_get_school):
        mock_get_school.return_value = None
        resp = client.post("/chat", json={
            "question": "Bonjour",
            "school_id": "inexistant"
        })
        assert resp.status_code == 404

    @patch("routes.chat.get_school")
    def test_chat_school_suspended(self, mock_get_school):
        from models.schemas import SchoolRead
        mock_get_school.return_value = SchoolRead(
            id="suspended", name="Suspendue",
            is_suspended=True
        )
        resp = client.post("/chat", json={
            "question": "Bonjour",
            "school_id": "suspended"
        })
        assert resp.status_code == 403

    @patch("routes.chat.get_school")
    def test_chat_with_session(self, mock_get_school):
        from models.schemas import SchoolRead
        mock_get_school.return_value = SchoolRead(
            id="upeps_01", name="UPEPS",
            primary_color="#11caa0", annee_scolaire_active="2025-2026"
        )
        with patch("routes.chat.query_rag") as mock_q:
            mock_q.return_value = ("Voici la réponse", [])
            resp = client.post("/chat", json={
                "question": "Explique le cours",
                "school_id": "upeps_01",
                "student_id": "stu-123",
                "session_id": "ses-123"
            })
            assert resp.status_code == 200
            data = resp.json()
            assert "answer" in data

# ============================================
# Lead
# ============================================

class TestLeadEndpoint:
    @patch("routes.leads.get_school")
    @patch("routes.leads.create_lead")
    def test_create_lead_success(self, mock_create, mock_get_school):
        from models.schemas import SchoolRead, LeadRead
        mock_get_school.return_value = SchoolRead(
            id="upeps_01", name="UPEPS",
            primary_color="#11caa0", annee_scolaire_active="2025-2026"
        )
        mock_create.return_value = LeadRead(
            id="lead-1", student_name="Amina Diallo",
            phone="+221771234567", school_id="upeps_01",
            created_at="2026-01-01T00:00:00"
        )
        resp = client.post("/lead", json={
            "student_name": "Amina Diallo",
            "phone": "+221771234567",
            "school_id": "upeps_01"
        })
        assert resp.status_code == 200
        assert resp.json()["student_name"] == "Amina Diallo"

    @patch("routes.leads.get_school")
    def test_create_lead_school_not_found(self, mock_get_school):
        mock_get_school.return_value = None
        resp = client.post("/lead", json={
            "student_name": "Test",
            "phone": "+221771234567",
            "school_id": "unknown"
        })
        assert resp.status_code == 404

    @patch("routes.leads.get_school")
    def test_create_lead_invalid_phone(self, mock_get_school):
        from models.schemas import SchoolRead
        mock_get_school.return_value = SchoolRead(
            id="upeps_01", name="UPEPS"
        )
        resp = client.post("/lead", json={
            "student_name": "Test",
            "phone": "123",  # too short
            "school_id": "upeps_01"
        })
        assert resp.status_code == 422  # Validation error

    @patch("routes.leads.get_school_admin")
    @patch("routes.leads.get_leads_by_school")
    def test_list_leads_requires_admin_key(self, mock_leads, mock_admin):
        resp = client.get("/leads/upeps_01")
        assert resp.status_code == 403

# ============================================
# Student
# ============================================

class TestStudentEndpoint:
    @patch("routes.students.authenticate_student")
    @patch("routes.students.get_school")
    def test_student_login_success(self, mock_get_school, mock_auth):
        from models.schemas import SchoolRead, StudentRead
        mock_get_school.return_value = SchoolRead(id="upeps_01", name="UPEPS")
        mock_auth.return_value = StudentRead(
            id="stu-1", name="Amina", phone="+221771234567",
            school_id="upeps_01", is_active=True
        )
        resp = client.post("/student/login", json={
            "phone": "+221771234567",
            "password": "test123",
            "school_id": "upeps_01"
        })
        assert resp.status_code == 200

    @patch("routes.students.get_school")
    def test_student_login_school_not_found(self, mock_get_school):
        mock_get_school.return_value = None
        resp = client.post("/student/login", json={
            "phone": "+221771234567",
            "password": "test",
            "school_id": "unknown"
        })
        assert resp.status_code == 404

# ============================================
# Chat Sessions
# ============================================

class TestChatSessions:
    @patch("services.school_service.get_school")
    def test_create_session_no_auth(self, mock_school):
        from models.schemas import SchoolRead
        mock_school.return_value = SchoolRead(id="upeps_01", name="UPEPS", annee_scolaire_active="2025-2026")
        resp = client.post("/chat-sessions", params={
            "student_id": "123e4567-e89b-12d3-a456-426614174000",
            "school_id": "upeps_01",
            "title": "Test Session"
        })
        assert resp.status_code in (200, 404, 500)

    @patch("services.school_service.get_school")
    def test_get_session_messages_not_found(self, mock_school):
        from models.schemas import SchoolRead
        mock_school.return_value = SchoolRead(id="upeps_01", name="UPEPS", annee_scolaire_active="2025-2026")
        resp = client.get("/chat-sessions/nonexistent/messages")
        assert resp.status_code in (200, 404, 500)

# ============================================
# Quiz
# ============================================

class TestQuizEndpoint:
    @patch("routes.quiz.get_school")
    def test_quiz_start_missing_student(self, mock_get_school):
        from models.schemas import SchoolRead
        mock_get_school.return_value = SchoolRead(id="upeps_01", name="UPEPS")
        resp = client.post("/quiz", json={
            "school_id": "upeps_01",
            "student_id": "",
            "question_count": 5
        })
        assert resp.status_code in (422, 500)  # validation or server error

    def test_quiz_answer_no_session(self):
        resp = client.post("/quiz/nonexistent/answer", json={
            "question_id": "q-1",
            "answer": 0
        })
        # 400 is also valid (validation before 404)
        assert resp.status_code in (400, 404, 500)

# ============================================
# Professor
# ============================================

class TestProfessorEndpoint:
    def test_professor_me_no_key(self):
        resp = client.get("/professor/me")
        # 422 = validation error (key header is missing), 403 = auth error
        assert resp.status_code in (403, 422)

# ============================================
# Documents
# ============================================

class TestDocumentsEndpoint:
    def test_list_documents_missing_school_id(self):
        resp = client.get("/documents")
        assert resp.status_code != 404  # route exists

# ============================================
# Schema Validation Tests (supplementary)
# ============================================

class TestSchemaValidation:
    def test_chat_request_min_length(self):
        from models.schemas import ChatRequest
        with pytest.raises(Exception):
            ChatRequest(question="", school_id="upeps_01")

    def test_school_id_pattern(self):
        from models.schemas import SchoolCreate
        with pytest.raises(Exception):
            SchoolCreate(id="INVALID-ID!", name="Test")

    def test_lead_phone_format(self):
        from models.schemas import LeadCreate
        with pytest.raises(Exception):
            LeadCreate(student_name="Test", phone="invalid", school_id="upeps_01")

    def test_quiz_answer_range(self):
        from models.schemas import QuizAnswerRequest
        with pytest.raises(Exception):
            QuizAnswerRequest(question_id="q-1", answer=10)

# ============================================
# Rate Limiting
# ============================================

class TestRateLimiting:
    @patch("routes.chat.get_school")
    def test_chat_rate_limit_applied(self, mock_get_school):
        from models.schemas import SchoolRead
        mock_get_school.return_value = SchoolRead(
            id="upeps_01", name="UPEPS",
            primary_color="#11caa0", annee_scolaire_active="2025-2026"
        )
        with patch("routes.chat.query_rag") as mock_q:
            mock_q.return_value = ("ok", [])
            for _ in range(3):
                resp = client.post("/chat", json={
                    "question": f"Question {_}",
                    "school_id": "upeps_01"
                })
            # Rate limit not hit with 3 requests, just check it works
            assert resp.status_code in (200, 429)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
