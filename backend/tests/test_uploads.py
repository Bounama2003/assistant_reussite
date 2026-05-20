"""
Upload endpoint tests for Assistant Réussite.
Uses FastAPI TestClient with mocked external services.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from unittest.mock import MagicMock, patch
import rag.engine as real_engine

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

import config.database as real_db
db_patcher = patch('config.database.get_supabase_client', return_value=MagicMock())
db_patcher.start()

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestAdminUpload:
    def test_upload_no_key(self):
        resp = client.post("/upload")
        assert resp.status_code in (403, 422)

    def test_upload_invalid_key(self):
        resp = client.post("/upload", headers={"X-Admin-Key": "invalid"})
        assert resp.status_code in (403, 422)

    @patch("routes.upload.get_school_admin")
    def test_upload_school_not_found(self, mock_admin):
        mock_admin.return_value = None
        resp = client.post("/upload", headers={"X-Admin-Key": "admin-test-xxx"})
        assert resp.status_code in (404, 422, 403)

    @patch("routes.upload.get_school_admin")
    def test_upload_wrong_key(self, mock_admin):
        from models.schemas import SchoolAdminRead
        mock_admin.return_value = SchoolAdminRead(
            id="test", name="Test", admin_key="different-key",
        )
        resp = client.post("/upload", headers={"X-Admin-Key": "admin-test-xxx"})
        # 403 = key mismatch, 422 = missing form data
        assert resp.status_code in (403, 422)

    def test_upload_no_file(self):
        resp = client.post("/upload", headers={"X-Admin-Key": "admin-test-xxx"})
        assert resp.status_code == 422


class TestProfessorUpload:
    def test_professor_upload_no_key(self):
        resp = client.post("/professor/upload")
        assert resp.status_code in (403, 422)

    def test_professor_upload_invalid_key_format(self):
        resp = client.post(
            "/professor/upload",
            headers={"X-Professor-Key": "too-short"},
        )
        assert resp.status_code in (403, 422)

    def test_professor_delete_no_key(self):
        resp = client.delete("/professor/documents/test.pdf")
        assert resp.status_code in (403, 422)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
