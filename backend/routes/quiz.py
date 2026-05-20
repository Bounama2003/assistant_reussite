import logging
from fastapi import APIRouter, HTTPException, Header, Request
from typing import Optional

from models.schemas import (
    QuizCreate, QuizStartResponse, QuizSessionRead,
    QuizAnswerRequest, QuizAnswerResponse, QuizResult,
    QuizQuestion,
)
from services.quiz_service import quiz_service
from services.school_service import get_school
from utils.rate_limit import limiter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/quiz", tags=["Quiz"])


def _get_student_from_header(x_student_id: Optional[str]) -> Optional[dict]:
    if not x_student_id or x_student_id.strip() == "":
        return None
    if x_student_id.startswith("annotation="):
        return None
    from config.database import get_supabase_client
    supabase = get_supabase_client()
    result = supabase.table("students").select("id, school_id").eq("id", x_student_id).execute()
    return result.data[0] if result.data else None


@router.post("", response_model=QuizStartResponse, responses={429: {"model": dict}})
@limiter.limit("10/minute")
async def start_quiz(request: Request, quiz_request: QuizCreate, x_student_id: Optional[str] = Header(None, alias="X-Student-Id")):
    try:
        school = get_school(quiz_request.school_id)
        if not school:
            raise HTTPException(status_code=404, detail="École introuvable")
        if school.is_suspended:
            raise HTTPException(status_code=403, detail="École suspendue")

        student = _get_student_from_header(x_student_id)
        if student and student.get("id") != quiz_request.student_id:
            raise HTTPException(status_code=403, detail="Accès non autorisé")

        result = quiz_service.generate_quiz(
            student_id=quiz_request.student_id,
            school_id=quiz_request.school_id,
            matiere=quiz_request.matiere,
            classe=quiz_request.classe,
            num_questions=quiz_request.question_count,
        )

        session_id = result["session_id"]
        questions = quiz_service.get_quiz_session(session_id)

        return QuizStartResponse(
            session_id=session_id,
            title=result["title"],
            questions=[QuizQuestion(**q) for q in questions["questions"]],
            total=result["total"],
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quiz start error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}", response_model=QuizSessionRead)
async def get_quiz(
    session_id: str,
    x_student_id: Optional[str] = Header(None, alias="X-Student-Id"),
):
    try:
        session = quiz_service.get_quiz_session(session_id)
        if x_student_id and session.get("student_id") != x_student_id:
            raise HTTPException(status_code=403, detail="Accès non autorisé")
        return QuizSessionRead(**session)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get quiz error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{session_id}/answer", response_model=QuizAnswerResponse, responses={429: {"model": dict}})
@limiter.limit("20/minute")
async def submit_answer(
    request: Request,
    session_id: str,
    answer_request: QuizAnswerRequest,
    x_student_id: Optional[str] = Header(None, alias="X-Student-Id"),
):
    try:
        session = quiz_service.get_quiz_session(session_id)
        if x_student_id and session.get("student_id") != x_student_id:
            raise HTTPException(status_code=403, detail="Accès non autorisé")

        result = quiz_service.submit_answer(session_id, answer_request.question_id, answer_request.answer)
        return QuizAnswerResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Submit answer error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}/result", response_model=QuizResult)
async def get_result(
    session_id: str,
    x_student_id: Optional[str] = Header(None, alias="X-Student-Id"),
):
    try:
        session = quiz_service.get_quiz_session(session_id)
        if x_student_id and session.get("student_id") != x_student_id:
            raise HTTPException(status_code=403, detail="Accès non autorisé")

        result = quiz_service.get_quiz_result(session_id)
        return QuizResult(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get result error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/student/{student_id}")
async def list_student_quizzes(student_id: str):
    try:
        from config.database import get_supabase_client
        supabase = get_supabase_client()
        result = supabase.table("quiz_sessions").select(
            "id, title, matiere, classe, total_questions, answered_count, score, status, started_at, completed_at"
        ).eq("student_id", student_id).order("started_at", desc=True).execute()
        return result.data or []
    except Exception as e:
        logger.error(f"List quizzes error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))