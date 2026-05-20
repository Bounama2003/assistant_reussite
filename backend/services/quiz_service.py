import json
import logging
import random
from datetime import datetime, timezone

import httpx
from config.database import get_supabase_client
from config.settings import settings

logger = logging.getLogger(__name__)
MAX_CONTEXT_CHARS = 4000


class QuizService:
    def __init__(self):
        self.supabase = get_supabase_client()

    # ---------------------------------------------------------------------
    # 1. Generate quiz
    # ---------------------------------------------------------------------
    def generate_quiz(self, student_id: str, school_id: str, matiere: str | None = None, classe: str | None = None, num_questions: int = 5) -> dict:
        try:
            student_res = self.supabase.table("students").select("name, classe, school_id").eq("id", student_id).execute()
            if not student_res.data:
                raise ValueError("Étudiant non trouvé")
            student = student_res.data[0]
            student_name = student.get("name")
            student_classe = student.get("classe") or classe
            actual_school_id = student.get("school_id") or school_id

            school_res = self.supabase.table("schools").select("annee_scolaire_active").eq("id", actual_school_id).execute()
            if not school_res.data:
                raise ValueError("École non trouvée")
            annee_scolaire = school_res.data[0].get("annee_scolaire_active", "2025-2026")

            docs_query = self.supabase.table("data_documents").select("text, metadata_")
            docs_query = docs_query.eq("metadata_->>school_id", actual_school_id)
            docs_query = docs_query.eq("metadata_->>annee_scolaire", annee_scolaire)
            if matiere:
                docs_query = docs_query.eq("metadata_->>matiere", matiere)
            docs_query = docs_query.eq("metadata_->>classe", student_classe)
            docs_query = docs_query.limit(20)
            docs_res = docs_query.execute()
            if not docs_res.data:
                matiere_msg = f" en {matiere}" if matiere else ""
                raise ValueError(f"Aucun document trouvé{matiere_msg} pour {student_classe}. Vérifiez que des documents existent pour cette classe.")

            docs_list = list(docs_res.data)
            random.shuffle(docs_list)

            context_chunks = []
            total_len = 0
            for doc in docs_list:
                content = doc.get("text", "") or doc.get("content", "")
                if not content:
                    continue
                if total_len >= MAX_CONTEXT_CHARS:
                    break
                remaining = MAX_CONTEXT_CHARS - total_len
                context_chunks.append(content[:remaining])
                total_len += len(content[:remaining])
            context = "\n\n".join(context_chunks)

            matiere_label = matiere or "cette matière"
            timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
            prompt = f"""Tu es un professeur qui crée un quiz diversifié pour ses élèves. Matière: {matiere_label}.

CONTENU DES COURS:
{context}

Génère {num_questions} questions à choix multiples (QCM) TRÈS VARIÉES basées sur le contenu ci-dessus.
RÈGLES ABSOLUES - Suivre STRICTEMENT:
- Chaque question doit porter sur un aspect DIFFÉRENT du cours
- Varier les niveaux de difficulté: facile, moyen, difficile
- Varier les types: définition, calcul, application, compréhension, analyse
- Aucune question ne doit être identique ou très similaire aux autres
- Le JSON doit contenir un champ "chapter" (string) qui identifie LE CHAPITRE ou NUMÉRO DE SECTION du cours auquel la question se réfère. Exemples: "Chapitre 1: La polygonation Maths", "Section 3: Les fractions", "Module 2: La digestion SVT". LIS LE CONTENU POUR TROUVER LES CHAPITRES RÉFÉRENCÉS.

Pour chaque question - JSON strict sans markdown:
- "question": texte clair de la question
- "options": array de 4 options (A, B, C, D)
- "correct_answer": index 0-3 de la bonne réponse
- "explanation": explication courte de la bonne réponse
- "chapter": NUMÉRO ET TITRE DU CHAPITRE exact parmi le contenu ci-dessus (ex: "Chapitre 2: Les angles")
- "source_doc": thème court (utilisé SEULEMENT si chapter est absent)"
[
  {{
    "question": "...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "...",
    "chapter": "Chapitre X: Titre du chapitre",
    "source_doc": "thème court"
  }}
]"""

            response = httpx.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.groq_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.groq_model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                    "max_tokens": 4096,
                },
                timeout=60.0,
            )
            response.raise_for_status()
            raw_content = response.json()["choices"][0]["message"]["content"]
            content_clean = raw_content.strip().strip("```json").strip("```").strip()
            questions = json.loads(content_clean)
            if not isinstance(questions, list) or not questions:
                raise ValueError("Impossible de générer les questions")

            now_str = datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M")
            title = f"Quiz {matiere or 'Général'} - {now_str}"
            session_payload = {
                "student_id": student_id,
                "school_id": actual_school_id,
                "title": title,
                "matiere": matiere or "Général",
                "classe": student_classe,
                "total_questions": len(questions),
                "answered_count": 0,
                "score": 0,
                "status": "in_progress",
                "started_at": datetime.now(timezone.utc).isoformat(),
            }
            session_res = self.supabase.table("quiz_sessions").insert(session_payload).execute()
            session_id = session_res.data[0]["id"]

            for idx, q in enumerate(questions):
                self.supabase.table("quiz_questions").insert({
                    "session_id": session_id,
                    "question_number": idx + 1,
                    "question_text": q["question"],
                    "options": q["options"],
                    "correct_answer": q["correct_answer"],
                    "explanation": q.get("explanation", ""),
                    "source_doc_filename": q.get("source_doc", ""),
                    "source_doc_matiere": matiere or "Général",
                    "chapter": q.get("chapter", ""),
                }).execute()

            return {
                "session_id": session_id,
                "title": title,
                "questions": questions,
                "total": len(questions),
            }

        except Exception as exc:
            logger.exception("generate_quiz failed")
            raise

    # ---------------------------------------------------------------------
    # 2. Submit answer
    # ---------------------------------------------------------------------
    def submit_answer(self, session_id: str, question_id: str, answer: int) -> dict:
        try:
            q_res = self.supabase.table("quiz_questions").select("*").eq("id", question_id).eq("session_id", session_id).execute()
            if not q_res.data:
                raise ValueError("Question introuvable")
            question = q_res.data[0]
            if question.get("student_answer") is not None:
                raise ValueError("Cette question a déjà été répondue")

            is_correct = (answer == question["correct_answer"])
            answered_at = datetime.now(timezone.utc).isoformat()

            self.supabase.table("quiz_questions").update({
                "student_answer": answer,
                "is_correct": is_correct,
                "answered_at": answered_at,
            }).eq("id", question_id).execute()

            session_res = self.supabase.table("quiz_sessions").select("*").eq("id", session_id).execute()
            if not session_res.data:
                raise ValueError("Session introuvable")
            session = session_res.data[0]

            new_answered = session.get("answered_count", 0) + 1
            new_score = session.get("score", 0) + (1 if is_correct else 0)
            total = session.get("total_questions", 0)
            quiz_completed = new_answered >= total

            self.supabase.table("quiz_sessions").update({
                "answered_count": new_answered,
                "score": new_score,
                "status": "completed" if quiz_completed else "in_progress",
                "completed_at": answered_at if quiz_completed else None,
            }).eq("id", session_id).execute()

            score_pct = (new_score / total * 100) if total > 0 else 0

            return {
                "question_id": question_id,
                "is_correct": is_correct,
                "correct_answer": question["correct_answer"],
                "explanation": question.get("explanation", ""),
                "score": round(score_pct, 1),
                "quiz_completed": quiz_completed,
            }

        except Exception as exc:
            logger.exception("submit_answer failed")
            raise

    # ---------------------------------------------------------------------
    # 3. Get quiz result
    # ---------------------------------------------------------------------
    def get_quiz_result(self, session_id: str) -> dict:
        try:
            session_res = self.supabase.table("quiz_sessions").select("*").eq("id", session_id).execute()
            if not session_res.data:
                raise ValueError("Session introuvable")
            session = session_res.data[0]

            q_res = self.supabase.table("quiz_questions").select("*").eq("session_id", session_id).order("question_number").execute()
            questions = q_res.data or []

            correct = sum(1 for q in questions if q.get("is_correct") is True)
            total = len(questions)
            score_pct = (correct / total * 100) if total > 0 else 0

            recommendations = []
            wrong_by_chapter = {}
            for q in questions:
                if q.get("is_correct") is False:
                    chapter = (q.get("chapter") or "").strip()
                    doc = (q.get("source_doc_filename") or "").strip()
                    label = chapter or f"SVT - {doc}" if doc else "ce chapitre du cours"
                    wrong_by_chapter.setdefault(label, 0)
                    wrong_by_chapter[label] += 1
            for label, count in wrong_by_chapter.items():
                msg = f"Revoir {label} - {count} erreur{'s' if count > 1 else ''}"
                recommendations.append(msg)

            return {
                "session_id": session_id,
                "total_questions": total,
                "correct_answers": correct,
                "score": round(score_pct, 1),
                "status": session.get("status", "in_progress"),
                "recommendations": recommendations,
            }

        except Exception as exc:
            logger.exception("get_quiz_result failed")
            raise

    # ---------------------------------------------------------------------
    # 4. Get quiz session
    # ---------------------------------------------------------------------
    def get_quiz_session(self, session_id: str) -> dict:
        try:
            session_res = self.supabase.table("quiz_sessions").select("*").eq("id", session_id).execute()
            if not session_res.data:
                raise ValueError("Session introuvable")
            session = session_res.data[0]

            q_res = self.supabase.table("quiz_questions").select("*").eq("session_id", session_id).order("question_number").execute()
            questions = q_res.data or []

            return {
                "id": session_id,
                "student_id": session.get("student_id"),
                "school_id": session.get("school_id"),
                "title": session.get("title", ""),
                "matiere": session.get("matiere"),
                "classe": session.get("classe"),
                "total_questions": session.get("total_questions", 0),
                "answered_count": session.get("answered_count", 0),
                "score": session.get("score", 0),
                "status": session.get("status", "in_progress"),
                "started_at": session.get("started_at"),
                "completed_at": session.get("completed_at"),
                "questions": [
                    {
                        "id": q["id"],
                        "session_id": session_id,
                        "question_number": q["question_number"],
                        "question_text": q["question_text"],
                        "options": q["options"],
                        "answered": q.get("student_answer") is not None,
                        "student_answer": q.get("student_answer"),
                        "is_correct": q.get("is_correct"),
                        "explanation": q.get("explanation"),
                        "source_doc_filename": q.get("source_doc_filename"),
                    }
                    for q in questions
                ],
            }

        except Exception as exc:
            logger.exception("get_quiz_session failed")
            raise

# Export instance for convenience
quiz_service = QuizService()
