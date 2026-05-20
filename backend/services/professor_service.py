import logging
import hashlib
import json
import secrets
import bcrypt
from typing import Optional
from config.database import get_supabase_client
from models.schemas import (
    ProfessorCreate, ProfessorRead, ProfessorLogin,
    ReactionCreate, ReactionRead,
    ProfessorStatsRead, ProfessorDocumentStat, ProfessorQuestionSummary,
)


logger = logging.getLogger(__name__)


def _hash_password(password: str) -> str:
    from config.settings import settings
    if getattr(settings, "legacy_hash_for_tests", False):
        return hashlib.sha256(password.encode()).hexdigest()
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    if len(password_hash) == 64 and all(c in "0123456789abcdef" for c in password_hash.lower()):
        return hashlib.sha256(password.encode()).hexdigest() == password_hash
    try:
        return bcrypt.checkpw(password.encode(), password_hash.encode())
    except Exception:
        return False


def create_professor(data: ProfessorCreate) -> ProfessorRead:
    supabase = get_supabase_client()

    existing = supabase.table("professeurs").select("id").eq("phone", data.phone).execute()
    if existing.data:
        raise ValueError("Un professeur avec ce numéro existe déjà")

    professor_key = f"professor-{data.school_id}-{secrets.token_urlsafe(12)}"

    payload = {
        "name": data.name,
        "phone": data.phone,
        "password_hash": "",  # pas de mot de passe - connexion par clé
        "school_id": data.school_id,
        "matieres": data.matieres,
        "classes": data.classes,
        "professor_key": professor_key,
        "is_active": True,
    }

    result = supabase.table("professeurs").insert(payload).execute()
    if not result.data:
        raise ValueError("Erreur lors de la création du compte professeur")

    row = result.data[0]
    return _row_to_professor(row)


def authenticate_professor(phone: str, password: str, school_id: str) -> ProfessorRead | None:
    supabase = get_supabase_client()

    result = supabase.table("professeurs").select("*").eq("phone", phone).eq("school_id", school_id).execute()
    if not result.data:
        return None

    prof = result.data[0]

    if not prof.get("is_active", True):
        return None

    if not verify_password(password, prof["password_hash"]):
        return None

    return _row_to_professor(prof)


def authenticate_professor_key(professor_key: str, school_id: str) -> ProfessorRead | None:
    supabase = get_supabase_client()
    result = supabase.table("professeurs").select("*").eq("professor_key", professor_key).eq("school_id", school_id).execute()
    if not result.data:
        return None
    prof = result.data[0]
    if not prof.get("is_active", True):
        return None
    return _row_to_professor(prof)


def reset_professor_key(professor_id: str, school_id: str) -> dict | None:
    supabase = get_supabase_client()
    new_key = f"professor-{school_id}-{secrets.token_urlsafe(12)}"
    result = supabase.table("professeurs").update({"professor_key": new_key}).eq("id", professor_id).eq("school_id", school_id).execute()
    if not result.data:
        return None
    return {"professor_key": new_key, "name": result.data[0].get("name", "")}


def _row_to_professor(row: dict) -> ProfessorRead:
    return ProfessorRead(
        id=row["id"],
        school_id=row["school_id"],
        name=row["name"],
        phone=row["phone"],
        matieres=row.get("matieres", []),
        classes=row.get("classes", []),
        professor_key=row.get("professor_key", ""),
        is_active=row.get("is_active", True),
        created_at=row.get("created_at"),
    )


def get_professors_by_school(school_id: str) -> list[ProfessorRead]:
    supabase = get_supabase_client()
    result = supabase.table("professeurs").select("*").eq("school_id", school_id).execute()
    return [_row_to_professor(r) for r in result.data]


def get_professor(professor_id: str) -> ProfessorRead | None:
    supabase = get_supabase_client()
    result = supabase.table("professeurs").select("*").eq("id", professor_id).execute()
    if not result.data:
        return None
    return _row_to_professor(result.data[0])


def add_reaction(data: ReactionCreate, professor_id: Optional[str] = None, student_id: Optional[str] = None) -> ReactionRead:
    supabase = get_supabase_client()
    if student_id and len(data.message_id) == 36 and "-" in data.message_id:
        existing = supabase.table("reactions").select("id").eq("message_id", data.message_id).eq("student_id", student_id).execute()
        if existing.data:
            raise ValueError("Reaction already submitted for this message")

    payload = {
        "message_id": data.message_id,
        "session_id": data.session_id,
        "rating": data.rating,
        "comment": data.comment,
        "professor_id": professor_id,
        "student_id": student_id,
    }
    result = supabase.table("reactions").insert(payload).execute()
    if not result.data:
        raise ValueError("Erreur lors de l'enregistrement de la réaction")
    row = result.data[0]

    # ── Push notification on negative feedback ──
    if data.rating is not None and data.rating <= 2 and professor_id is not None:
        try:
            from services.push_service import send_to_user
            send_to_user(
                user_id=professor_id,
                role="professor",
                title="Feedback négatif reçu",
                body=f"Un étudiant a noté une réponse {data.rating}/5.",
                data={"url": "/professor/notifications", "type": "negative_feedback"},
            )
        except Exception:
            logger.warning("Push notification failed for reaction", exc_info=True)

    return ReactionRead(
        id=row["id"],
        message_id=row["message_id"],
        session_id=row["session_id"],
        student_id=row.get("student_id"),
        professor_id=row.get("professor_id"),
        rating=row["rating"],
        comment=row.get("comment"),
        created_at=row.get("created_at"),
    )


def get_professor_stats(professor_id: str, school_id: str) -> ProfessorStatsRead:
    supabase = get_supabase_client()

    prof = get_professor(professor_id)
    if not prof:
        return ProfessorStatsRead(professor_id=professor_id, school_id=school_id, total_questions=0, avg_rating=None, thumbs_up=0, thumbs_down=0, last_updated=None)

    matieres = prof.matieres or []
    classes = prof.classes or []
    professor_name = prof.name or ""

    students_in_classes = supabase.table("students").select("id").eq("school_id", school_id).in_("classe", classes).execute()
    my_student_ids = [str(s["id"]) for s in students_in_classes.data]

    doc_result = supabase.table("data_documents").select("id, metadata_").execute()
    prof_doc_ids = set()
    for row in doc_result.data:
        meta = row.get("metadata_", {})
        if meta.get("school_id") != school_id:
            continue
        doc_prof = meta.get("professeur", "")
        doc_matiere = meta.get("matiere", "")
        doc_classe = meta.get("classe", "")
        if doc_prof == professor_name or (doc_matiere in matieres and doc_classe in (classes or [""])):
            if row.get("id"):
                prof_doc_ids.add(str(row["id"]))

    my_messages = []
    if my_student_ids:
        session_result = supabase.table("chat_sessions").select("id").eq("school_id", school_id).in_("student_id", my_student_ids).execute()
        my_session_ids = [str(s["id"]) for s in session_result.data]
        if my_session_ids:
            msg_result = supabase.table("chat_messages").select("id").in_("session_id", my_session_ids).execute()
            my_messages = [str(m["id"]) for m in msg_result.data]

    total_questions = len(my_messages)

    reactions_result = supabase.table("reactions").select("rating, message_id, professor_id").execute()
    ratings = []
    for r in reactions_result.data:
        pid = r.get("professor_id") or ""
        mid = r.get("message_id") or ""
        if mid in my_messages or mid in prof_doc_ids or pid == professor_id:
            if r.get("rating"):
                ratings.append(r["rating"])

    thumbs_up = sum(1 for r in ratings if r >= 4)
    thumbs_down = sum(1 for r in ratings if r <= 2)
    avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else None

    return ProfessorStatsRead(
        professor_id=professor_id,
        school_id=school_id,
        total_questions=total_questions,
        avg_rating=avg_rating,
        thumbs_up=thumbs_up,
        thumbs_down=thumbs_down,
        last_updated=None,
    )


def get_professor_documents(professor_id: str, school_id: str) -> list[ProfessorDocumentStat]:
    supabase = get_supabase_client()

    prof = get_professor(professor_id)
    if not prof:
        return []
    matieres = prof.matieres or []
    classes = prof.classes or []
    professor_name = prof.name or ""

    students_in_classes = supabase.table("students").select("id").eq("school_id", school_id).in_("classe", classes).execute()
    my_student_ids = [str(s["id"]) for s in students_in_classes.data]

    doc_messages: dict[str, set[str]] = {}
    all_msg_ids: set[str] = set()
    students_sessions: dict[str, list[str]] = {}
    if my_student_ids:
        sess_result = supabase.table("chat_sessions").select("id, student_id").eq("school_id", school_id).in_("student_id", my_student_ids).execute()
        for s in sess_result.data:
            sid = str(s.get("student_id"))
            if sid not in students_sessions:
                students_sessions[sid] = []
            students_sessions[sid].append(str(s["id"]))
        for sess_list in students_sessions.values():
            if not sess_list:
                continue
            msgs = supabase.table("chat_messages").select("id, sources").in_("session_id", sess_list).execute()
            for m in msgs.data:
                msg_id = str(m["id"])
                all_msg_ids.add(msg_id)
                try:
                    sources = json.loads(m.get("sources") or "[]")
                except Exception:
                    sources = []
                for src in sources:
                    if not isinstance(src, dict):
                        continue
                    meta = src.get("metadata") or {}
                    fname = meta.get("filename") or ""
                    if fname:
                        if fname not in doc_messages:
                            doc_messages[fname] = set()
                        doc_messages[fname].add(msg_id)

    doc_reactions: dict[str, list[int]] = {}
    if all_msg_ids:
        reactions_result = supabase.table("reactions").select("message_id, rating").in_("message_id", list(all_msg_ids)).execute()
        msg_rating: dict[str, int] = {}
        for r in reactions_result.data:
            mid = str(r.get("message_id"))
            rating = r.get("rating")
            if mid and rating:
                msg_rating[mid] = rating
        for fname, msg_ids in doc_messages.items():
            doc_reactions[fname] = [msg_rating[mid] for mid in msg_ids if mid in msg_rating]

    doc_result = supabase.table("data_documents").select("id, metadata_").execute()
    docs = []
    seen = {}
    for row in doc_result.data:
        meta = row.get("metadata_", {})
        if meta.get("school_id") != school_id:
            continue
        doc_prof = meta.get("professeur", "")
        doc_matiere = meta.get("matiere", "")
        doc_classe = meta.get("classe", "")
        if doc_prof == professor_name or (doc_matiere in matieres and doc_classe in (classes or [""])):
            filename = meta.get("filename", "")
            if not filename:
                continue
            if filename in seen:
                continue
            seen[filename] = True

            fname_msg_ids = doc_messages.get(filename, set())
            fname_ratings = doc_reactions.get(filename, [])
            query_count = len(fname_msg_ids)
            thumbs_up = sum(1 for r in fname_ratings if r >= 4)
            thumbs_down = sum(1 for r in fname_ratings if r <= 2)
            avg_rating = round(sum(fname_ratings) / len(fname_ratings), 2) if fname_ratings else None

            docs.append(ProfessorDocumentStat(
                filename=filename,
                matiere=doc_matiere,
                classe=doc_classe,
                query_count=query_count,
                thumbs_up=thumbs_up,
                thumbs_down=thumbs_down,
                avg_rating=avg_rating,
            ))
    return docs


def get_professor_questions(professor_id: str, school_id: str, limit: int = 20) -> list[ProfessorQuestionSummary]:
    supabase = get_supabase_client()

    prof = get_professor(professor_id)
    if not prof:
        return []

    matieres = prof.matieres or []
    classes = prof.classes or []
    professor_name = prof.name or ""

    students_in_classes = supabase.table("students").select("id, name, classe").eq("school_id", school_id).in_("classe", classes).execute()
    student_map = {str(s["id"]): {"name": s.get("name", "Élève"), "classe": s.get("classe", "")} for s in students_in_classes.data}
    my_student_ids = list(student_map.keys())

    if not my_student_ids:
        return []

    sessions_result = supabase.table("chat_sessions").select("id, student_id").eq("school_id", school_id).in_("student_id", my_student_ids).execute()
    my_session_ids = [str(s["id"]) for s in sessions_result.data]

    if not my_session_ids:
        return []

    messages_result = supabase.table("chat_messages").select("id, session_id, content, role, created_at").in_("session_id", my_session_ids).order("created_at", desc=True).limit(limit).execute()

    questions = []
    session_map = {str(s["id"]): s for s in sessions_result.data}
    for msg in messages_result.data:
        sid = session_map.get(str(msg.get("session_id", "")), {}).get("student_id")
        sinfo = student_map.get(str(sid), {"name": "Élève", "classe": ""})
        questions.append(ProfessorQuestionSummary(
            session_id=msg.get("session_id", ""),
            student_name=sinfo["name"],
            question_preview=msg.get("content", "")[:80],
            matiere="",
            classe=sinfo["classe"],
            timestamp=msg.get("created_at"),
        ))

    return questions


def get_top_frequent_questions(professor_id: str, school_id: str, top_n: int = 5) -> list[dict]:
    supabase = get_supabase_client()

    prof = get_professor(professor_id)
    if not prof:
        return []

    matieres = prof.matieres or []
    classes = prof.classes or []

    students_in_classes = supabase.table("students").select("id").eq("school_id", school_id).in_("classe", classes).execute()
    my_student_ids = [str(s["id"]) for s in students_in_classes.data]

    if not my_student_ids:
        return []

    sessions_result = supabase.table("chat_sessions").select("id").eq("school_id", school_id).in_("student_id", my_student_ids).execute()
    my_session_ids = [str(s["id"]) for s in sessions_result.data]

    if not my_session_ids:
        return []

    # Only get assistant messages (they have sources)
    messages_result = supabase.table("chat_messages").select("id, content, sources").in_("session_id", my_session_ids).eq("role", "assistant").execute()

    # Count by matiere from document sources
    matiere_counts: dict[str, int] = {}
    total_questions = 0

    for msg in messages_result.data:
        content = (msg.get("content") or "").strip()
        if not content or len(content) < 5:
            continue

        total_questions += 1
        # Track which matieres are referenced in this message's sources
        message_matieres: set[str] = set()

        try:
            sources = json.loads(msg.get("sources") or "[]")
        except (json.JSONDecodeError, TypeError):
            sources = []

        for src in sources:
            if not isinstance(src, dict):
                continue
            meta = src.get("metadata") or {}
            matiere = meta.get("matiere") or ""
            if matiere and matiere in matieres:
                message_matieres.add(matiere)

        # If no matiere found in sources, try to infer from content keywords
        if not message_matieres:
            for matiere in matieres:
                if matiere.lower() in content.lower():
                    message_matieres.add(matiere)

        for m in message_matieres:
            matiere_counts[m] = matiere_counts.get(m, 0) + 1

    results = [
        {"topic": matiere, "count": count, "matiere": matiere}
        for matiere, count in matiere_counts.items()
    ]
    results.sort(key=lambda x: x["count"], reverse=True)
    return results[:top_n]


def get_professor_difficulties(professor_id: str, school_id: str) -> list[dict]:
    """Returns quiz scores per matiere for the professor's students to identify difficult subjects."""
    supabase = get_supabase_client()

    prof = get_professor(professor_id)
    if not prof:
        return []

    classes = prof.classes or []
    matieres = prof.matieres or []

    students_in_classes = supabase.table("students").select("id").eq("school_id", school_id).in_("classe", classes).execute()
    my_student_ids = [str(s["id"]) for s in students_in_classes.data]

    if not my_student_ids:
        return []

    # Get completed quiz sessions for these students
    quiz_result = supabase.table("quiz_sessions") \
        .select("matiere, score, total_questions, classe") \
        .eq("school_id", school_id) \
        .eq("status", "completed") \
        .in_("student_id", my_student_ids) \
        .execute()

    # Aggregate scores by matiere
    matiere_data: dict[str, dict] = {}
    for q in quiz_result.data:
        matiere = q.get("matiere") or "Général"
        score = q.get("score", 0)
        total = q.get("total_questions", 1)
        pct = round((score / total) * 100, 1) if total > 0 else 0

        if matiere not in matiere_data:
            matiere_data[matiere] = {
                "matiere": matiere,
                "total_quiz": 0,
                "total_correct": 0,
                "total_questions": 0,
                "avg_score": 0.0,
            }
        md = matiere_data[matiere]
        md["total_quiz"] += 1
        md["total_correct"] += score
        md["total_questions"] += total

    # Calculate averages and determine difficulty level
    results = []
    for matiere, md in matiere_data.items():
        avg = round((md["total_correct"] / md["total_questions"]) * 100, 1) if md["total_questions"] > 0 else 0
        niveau = "bonne" if avg >= 70 else ("moyen" if avg >= 50 else "faible")
        results.append({
            "matiere": matiere,
            "avg_score": avg,
            "total_quiz": md["total_quiz"],
            "total_questions": md["total_questions"],
            "niveau": niveau,
            "students_count": len(my_student_ids),
        })

    results.sort(key=lambda x: x["avg_score"])
    return results


def get_notifications(professor_id: str, school_id: str, limit: int = 10) -> list[dict]:
    supabase = get_supabase_client()
    notifications = []

    prof = get_professor(professor_id)
    matieres = prof.matieres if prof else []
    classes = prof.classes if prof else []
    professor_name = prof.name if prof else ""

    doc_result = supabase.table("data_documents").select("metadata_").execute()
    prof_doc_ids = set()
    prof_doc_count = 0
    for row in doc_result.data:
        meta = row.get("metadata_", {})
        if meta.get("school_id") != school_id:
            continue
        doc_prof = meta.get("professeur", "")
        doc_matiere = meta.get("matiere", "")
        doc_classe = meta.get("classe", "")
        is_mine = doc_prof == professor_name or (doc_matiere in matieres and doc_classe in (classes or [""]))
        if is_mine:
            if row.get("id"):
                prof_doc_ids.add(str(row["id"]))
            prof_doc_count += 1

    reactions_result = supabase.table("reactions").select("id, rating, created_at, message_id, professor_id").execute()
    for r in reactions_result.data:
        pid = r.get("professor_id") or ""
        mid = r.get("message_id") or ""
        if pid == professor_id or mid in prof_doc_ids:
            if r.get("rating", 0) <= 2:
                notifications.append({
                    "id": r["id"],
                    "type": "negative_feedback",
                    "title": "Feedback négatif reçu",
                    "message": f"Une réponse a été mal notée ({r['rating']}/5)",
                    "created_at": r.get("created_at"),
                })

    if prof_doc_count > 0:
        notifications.append({
            "id": f"doc_count_{professor_id}",
            "type": "document_upload",
            "title": "Documents uploadés",
            "message": f"{prof_doc_count} document(s) trouvé(s) dans votre espace",
            "created_at": None,
        })

    return notifications[:limit]