import pytest
import re
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from rag.engine import (
    QUIZ_PATTERNS,
    MENTOR_PATTERNS,
    QUIZ_ANSWER_PATTERNS,
    GREETING_PATTERNS,
    IDENTITY_PATTERNS,
    _detect_mode,
    _is_greeting
)


class TestQuizPatterns:
    def test_quiz_triggers(self):
        quiz_queries = [
            "fais un quiz",
            "je veux m'entraîner pour l'examen",
            "un qcm de maths",
            "test de révision",
            "pose moi des questions",
            "entraînement",
        ]
        for q in quiz_queries:
            assert QUIZ_PATTERNS.search(q), f"Should match: {q}"

    def test_quiz_negative(self):
        non_quiz = [
            "explique le cours",
            "résumé du chapitre",
            "je comprends pas",
        ]
        for q in non_quiz:
            assert not QUIZ_PATTERNS.search(q), f"Should NOT match: {q}"


class TestMentorPatterns:
    def test_mentor_triggers(self):
        mentor_queries = [
            "explique la photosynthèse",
            "résumé du chapitre 3",
            "je comprends pas",
            "cours sur les nombres",
            "exemple d'exercice",
            "développes davantage",
        ]
        for q in mentor_queries:
            assert MENTOR_PATTERNS.search(q), f"Should match: {q}"


class TestQuizAnswerPatterns:
    def test_answer_patterns(self):
        answer_queries = [
            "1.b",
            "2.a",
            "3.c",
            "a)",
            "b)",
            "ma réponse: 1.a",
            "voici mes réponses",
        ]
        for q in answer_queries:
            assert QUIZ_ANSWER_PATTERNS.search(q), f"Should match: {q}"

    def test_not_answer_patterns(self):
        non_answers = [
            "explique moi",
            "c'est quoi",
            "merci",
        ]
        for q in non_answers:
            assert not QUIZ_ANSWER_PATTERNS.search(q), f"Should NOT match: {q}"


class TestGreetingPatterns:
    def test_greeting_triggers(self):
        greetings = [
            "bonjour",
            "salut",
            "coucou",
            "hello",
            "salam",
            "qui es-tu",
            "c'est quoi ton nom",
        ]
        for g in greetings:
            assert GREETING_PATTERNS.match(g), f"Should match: {g}"

    def test_greeting_negative(self):
        non_greetings = [
            "explique le cours",
            "quiz de maths",
            "question sur le chapitre",
        ]
        for g in non_greetings:
            assert not GREETING_PATTERNS.match(g), f"Should NOT match: {g}"


class TestIdentityPatterns:
    def test_identity_triggers(self):
        identity_queries = [
            "qui es-tu",
            "comment tu t'appelles",
            "tu es qui",
            "présente toi",
        ]
        for q in identity_queries:
            assert IDENTITY_PATTERNS.search(q), f"Should match: {q}"


class TestDetectMode:
    def test_detect_quiz_mode(self):
        assert _detect_mode("fais un quiz") == "quiz"

    def test_detect_mentor_mode(self):
        assert _detect_mode("explique le cours de maths") == "mentor"

    def test_detect_quiz_correct_with_history(self):
        history = [
            {"role": "assistant", "content": "Voici une question: Quelle est la capitale du Sénégal?"},
            {"role": "user", "content": "1.a"},
        ]
        result = _detect_mode("1.a", history)
        assert result == "quiz_correct"

    def test_detect_normal_mode(self):
        assert _detect_mode("c'est quoi la photosynthesis") == "normal"

    def test_is_greeting(self):
        assert _is_greeting("bonjour") is True
        assert _is_greeting("salut") is True
        assert _is_greeting("explique le cours") is False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])