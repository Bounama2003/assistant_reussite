import logging
import uuid
from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from models.schemas import ChatSessionCreate, ChatSessionRead, ChatMessageRead, ErrorResponse
from services.chat_session_service import (
    create_session,
    get_sessions_by_student,
    get_session,
    update_session_title,
    delete_session,
    add_message,
    get_messages_by_session,
)
from config.database import get_supabase_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat-sessions", tags=["Chat Sessions"])


def _is_valid_uuid(value: str) -> bool:
    """Check if a string is a valid UUID format."""
    try:
        uuid.UUID(str(value))
        return True
    except (ValueError, AttributeError):
        return False


@router.post("", response_model=ChatSessionRead)
async def create_chat_session(
    student_id: Optional[str] = Query(None),
    school_id: str = Query(...),
    title: Optional[str] = None,
):
    from services.school_service import get_school
    
    school = get_school(school_id)
    if not school:
        raise HTTPException(status_code=404, detail="École introuvable")
    if school.is_suspended:
        raise HTTPException(status_code=403, detail="École suspendue")
    
    # Resolve student_id - validate UUID format and existence
    resolved_student_id = None
    if student_id:
        if not _is_valid_uuid(student_id):
            raise HTTPException(status_code=400, detail="ID élève invalide")
        
        supabase = get_supabase_client()
        student_check = supabase.table("students").select("id").eq("id", student_id).eq("school_id", school_id).execute()
        if not student_check.data:
            raise HTTPException(status_code=404, detail="Élève introuvable")
        resolved_student_id = student_id
    
    try:
        return create_session(resolved_student_id, school_id, title or "Nouvelle conversation")
    except Exception as e:
        logger.error(f"Create session error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Erreur lors de la création de la session")


@router.get("/student/{student_id}", response_model=list[ChatSessionRead])
async def get_student_sessions(student_id: str):
    return get_sessions_by_student(student_id)


@router.get("/{session_id}", response_model=ChatSessionRead)
async def get_session_detail(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session introuvable")
    return session


@router.put("/{session_id}/title")
async def update_title(session_id: str, title: str):
    if not update_session_title(session_id, title):
        raise HTTPException(status_code=404, detail="Session introuvable")
    return {"message": "Titre mis à jour"}


@router.delete("/{session_id}")
async def delete_chat_session(session_id: str):
    if not delete_session(session_id):
        raise HTTPException(status_code=404, detail="Session introuvable")
    return {"message": "Session supprimée"}


@router.post("/{session_id}/messages", response_model=ChatMessageRead)
async def add_chat_message(
    session_id: str,
    role: str,
    content: str,
    sources: Optional[list] = None,
):
    from pydantic import BaseModel
    class MessageBody(BaseModel):
        sources: Optional[list] = None
    
    if role not in ("user", "assistant"):
        raise HTTPException(status_code=400, detail="Role doit être 'user' ou 'assistant'")
    try:
        return add_message(session_id, role, content, sources if sources is not None else [])
    except Exception as e:
        logger.error(f"Add message error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Erreur lors de l'ajout du message")


@router.get("/{session_id}/messages", response_model=list[ChatMessageRead])
async def get_session_messages(session_id: str):
    return get_messages_by_session(session_id)