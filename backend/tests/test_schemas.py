import pytest
from pydantic import ValidationError
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from models.schemas import (
    ChatRequest,
    LeadCreate,
    StudentLogin,
    ConvertLeadRequest,
    SchoolCreate,
    UploadRequest
)


class TestChatRequest:
    def test_valid_chat_request(self):
        req = ChatRequest(
            question="Qu'est-ce que la photosynthèse?",
            school_id="upeps_01"
        )
        assert req.question == "Qu'est-ce que la photosynthèse?"
        assert req.school_id == "upeps_01"
        assert req.student_id is None

    def test_chat_request_with_student(self):
        req = ChatRequest(
            question="explique le cours",
            school_id="upeps_01",
            student_id="123e4567-e89b-12d3-a456-426614174000",
            student_classe="Terminale",
            student_name="Amina"
        )
        assert req.student_id is not None
        assert req.student_classe == "Terminale"
        assert req.student_name == "Amina"

    def test_chat_request_missing_question(self):
        with pytest.raises(ValidationError):
            ChatRequest(school_id="upeps_01")

    def test_chat_request_missing_school(self):
        with pytest.raises(ValidationError):
            ChatRequest(question="test")


class TestLeadCreate:
    def test_valid_lead(self):
        lead = LeadCreate(
            student_name="Amina Diallo",
            phone="+221771234567",
            school_id="upeps_01"
        )
        assert lead.student_name == "Amina Diallo"
        assert lead.phone == "+221771234567"

    def test_lead_with_serie(self):
        lead = LeadCreate(
            student_name="Moussa",
            phone="+221771234567",
            school_id="upeps_01",
            serie="S"
        )
        assert lead.serie == "S"

    def test_lead_missing_name(self):
        with pytest.raises(ValidationError):
            LeadCreate(phone="+221771234567", school_id="upeps_01")

    def test_lead_missing_phone(self):
        with pytest.raises(ValidationError):
            LeadCreate(student_name="Amina", school_id="upeps_01")


class TestStudentLogin:
    def test_valid_login(self):
        login = StudentLogin(
            phone="+221771234567",
            password="test123",
            school_id="upeps_01"
        )
        assert login.phone == "+221771234567"
        assert login.password == "test123"
        assert login.school_id == "upeps_01"

    def test_login_min_password(self):
        with pytest.raises(ValidationError):
            StudentLogin(phone="+221771234567", password="abc")


class TestConvertLeadRequest:
    def test_valid_convert(self):
        req = ConvertLeadRequest(
            classe="Terminale",
            password="monmotdepasse"
        )
        assert req.classe == "Terminale"
        assert req.password == "monmotdepasse"


class TestSchoolCreate:
    def test_valid_school(self):
        school = SchoolCreate(
            id="test_school",
            name="Ecole Test"
        )
        assert school.id == "test_school"
        assert school.name == "Ecole Test"

    def test_school_with_optional_fields(self):
        school = SchoolCreate(
            id="test_school",
            name="Ecole Test",
            contact_email="test@ecole.sn"
        )
        assert school.contact_email == "test@ecole.sn"


class TestUploadRequest:
    def test_valid_upload(self):
        req = UploadRequest(
            school_id="upeps_01",
            matiere="Math",
            classe="Terminale",
            professeur="M. Diallo",
            annee_scolaire="2025-2026"
        )
        assert req.matiere == "Math"
        assert req.classe == "Terminale"

    def test_upload_missing_matiere(self):
        with pytest.raises(ValidationError):
            UploadRequest(
                school_id="upeps_01",
                classe="Terminale"
            )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])