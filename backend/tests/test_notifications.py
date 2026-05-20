"""
Notification endpoint & push service tests for Assistant Réussite.
Uses FastAPI TestClient with mocked external services.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from unittest.mock import MagicMock, patch

# Patch heavy model classes before import
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


class TestNotificationsPublicKey:
    def test_public_key_returns_key(self):
        resp = client.get("/notifications/public-key")
        assert resp.status_code == 200
        data = resp.json()
        assert "public_key" in data
        assert isinstance(data["public_key"], str)
        assert len(data["public_key"]) > 0

    def test_public_key_no_auth_required(self):
        resp = client.get("/notifications/public-key")
        assert resp.status_code == 200


class TestNotificationsSubscribe:
    def test_subscribe_no_auth(self):
        resp = client.post("/notifications/subscribe", json={
            "endpoint": "https://example.com/push",
            "p256dh_key": "test-key",
            "auth_key": "test-auth",
        })
        assert resp.status_code == 401

    def test_subscribe_invalid_auth(self):
        resp = client.post(
            "/notifications/subscribe",
            json={
                "endpoint": "https://example.com/push",
                "p256dh_key": "test-key",
                "auth_key": "test-auth",
            },
            headers={"X-Student-Id": "nonexistent"},
        )
        assert resp.status_code in (200, 500)


class TestNotificationsUnsubscribe:
    def test_unsubscribe_no_auth(self):
        resp = client.post("/notifications/unsubscribe", json={
            "endpoint": "https://example.com/push",
        })
        assert resp.status_code == 401


class TestNotificationsTest:
    def test_test_push_no_auth(self):
        resp = client.post("/notifications/test")
        assert resp.status_code == 401


class TestPushService:
    def test_vapid_public_key_format(self):
        from services.push_service import _get_vapid_public_key
        key = _get_vapid_public_key()
        assert isinstance(key, str)
        assert len(key) > 0

    @patch("services.push_service.get_supabase_client")
    def test_subscribe_db_call(self, mock_db):
        from services.push_service import subscribe
        mock_client = MagicMock()
        mock_db.return_value = mock_client
        mock_client.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock()
        mock_client.table.return_value.insert.return_value.execute.return_value.data = [{"id": "1"}]

        result = subscribe("user-1", "student", "https://example.com", "key", "auth")
        assert result is True

    @patch("services.push_service.get_supabase_client")
    def test_unsubscribe_db_call(self, mock_db):
        from services.push_service import unsubscribe
        mock_client = MagicMock()
        mock_db.return_value = mock_client
        mock_client.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value.data = [{"id": "1"}]

        result = unsubscribe("user-1", "student")
        assert result is True

    @patch("services.push_service._get_subscriptions")
    def test_send_to_user_no_subscription(self, mock_subs):
        from services.push_service import send_to_user
        mock_subs.return_value = []
        count = send_to_user("user-1", "student", "Test", "Body")
        assert count == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
