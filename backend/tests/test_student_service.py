import pytest
import hashlib
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from services.student_service import _hash_password, verify_password


class TestPasswordHashing:
    def test_hash_password_returns_sha256(self):
        result = _hash_password("test123")
        assert len(result) == 64
        assert result == hashlib.sha256("test123".encode()).hexdigest()

    def test_verify_password_correct(self):
        hashed = _hash_password("mypassword")
        assert verify_password("mypassword", hashed) is True

    def test_verify_password_wrong(self):
        hashed = _hash_password("mypassword")
        assert verify_password("wrongpassword", hashed) is False

    def test_different_passwords_different_hashes(self):
        hash1 = _hash_password("password1")
        hash2 = _hash_password("password2")
        assert hash1 != hash2

    def test_same_password_same_hash(self):
        hash1 = _hash_password("samepassword")
        hash2 = _hash_password("samepassword")
        assert hash1 == hash2


class TestPasswordValidation:
    def test_empty_password(self):
        hashed = _hash_password("")
        assert verify_password("", hashed) is True
        assert verify_password("notempty", hashed) is False

    def test_unicode_password(self):
        hashed = _hash_password("motdepasseé")
        assert verify_password("motdepasseé", hashed) is True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])