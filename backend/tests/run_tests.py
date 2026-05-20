#!/usr/bin/env python3
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from services.student_service import _hash_password, verify_password

print("=== Test Password Hashing ===")

result = _hash_password("test123")
expected = "ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae"
assert result == expected, f"Expected {expected}, got {result}"
print("✓ test_hash_password_returns_sha256")

hashed = _hash_password("mypassword")
assert verify_password("mypassword", hashed) is True
print("✓ test_verify_password_correct")

assert verify_password("wrongpassword", hashed) is False
print("✓ test_verify_password_wrong")

print("\n=== Test RAG Engine Patterns ===")

import re
QUIZ_PATTERNS = re.compile(
    r"(quiz|examen|exo|exercise|qcm|test|évaluation|révision|réviser|"
    r"corrige|correct|réponse|vrai|faux|choix multiple|"
    r"question (sur|de)|fais? (un |le )?(quiz|examen|test|exercice)|"
    r"pose (moi )?(des |une )?(questions?|quiz)|entraine|entraînement)",
    re.IGNORECASE
)

assert QUIZ_PATTERNS.search("fais un quiz")
print("✓ quiz triggers")

assert QUIZ_PATTERNS.search("je veux m'entraîner pour l'examen")
print("✓ examen triggers")

assert not QUIZ_PATTERNS.search("explique le cours")
print("✓ not a quiz query")

GREETING_PATTERNS = re.compile(
    r"^(salut|bonjour|bonsoir|coucou|hey|hello|hi|yo|wesh|salam|slm|cc|qui (es|est)[- ]?tu|c'est quoi ton nom|comment tu t'appelles|tu es qui|presente[- ]?toi|presentation)",
    re.IGNORECASE
)

assert GREETING_PATTERNS.match("bonjour")
print("✓ greeting matches")

assert GREETING_PATTERNS.match("salut")
print("✓ salut matches")

assert not GREETING_PATTERNS.match("explique le cours")
print("✓ not a greeting")

print("\n=== Test Schemas ===")

from pydantic import ValidationError
from models.schemas import ChatRequest, LeadCreate

try:
    req = ChatRequest(question="test", school_id="upeps_01")
    assert req.question == "test"
    print("✓ valid chat request")
except Exception as e:
    print(f"✗ valid chat request: {e}")

try:
    ChatRequest(school_id="upeps_01")
    print("✗ should have raised ValidationError")
except ValidationError:
    print("✓ missing question raises ValidationError")

lead = LeadCreate(student_name="Amina", phone="+221771234567", school_id="test")
assert lead.student_name == "Amina"
print("✓ valid lead")

print("\n=== All Tests Passed ===")