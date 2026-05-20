import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_export_chat_pdf_no_session():
    """Test PDF export with non-existent session"""
    resp = client.get("/exports/chat/non-existent-id/pdf")
    assert resp.status_code == 404


def test_export_chat_txt_no_session():
    resp = client.get("/exports/chat/non-existent-id/txt")
    assert resp.status_code == 404


def test_export_leads_no_admin_key():
    resp = client.get("/exports/schools/test-school/leads/excel")
    assert resp.status_code == 403
    
    resp = client.get("/exports/schools/test-school/leads/pdf")
    assert resp.status_code == 403


def test_export_students_no_admin_key():
    resp = client.get("/exports/schools/test-school/students/excel")
    assert resp.status_code == 403


def test_list_documents_no_admin_key():
    resp = client.get("/documents?school_id=test")
    assert resp.status_code == 403


def test_delete_document_no_admin_key():
    resp = client.delete("/documents?school_id=test&filename=test.pdf")
    assert resp.status_code == 403


def test_health_endpoint():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_health_ready_endpoint():
    resp = client.get("/health/ready")
    assert resp.status_code in (200, 503)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
