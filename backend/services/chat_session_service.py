import json
from datetime import datetime, timezone
from config.database import get_supabase_client
from models.schemas import ChatSessionCreate, ChatSessionRead, ChatMessageRead


def create_session(student_id: str, school_id: str, title: str | None = None) -> ChatSessionRead:
    supabase = get_supabase_client()
    
    payload = {
        "student_id": student_id,
        "school_id": school_id,
        "title": title or "Nouvelle conversation",
    }
    
    result = supabase.table("chat_sessions").insert(payload).execute()
    if not result.data:
        raise ValueError("Erreur lors de la création de la session")
    
    row = result.data[0]
    return ChatSessionRead(
        id=row["id"],
        student_id=row["student_id"],
        school_id=row["school_id"],
        title=row["title"],
        is_active=row.get("is_active", True),
    )


def get_sessions_by_student(student_id: str) -> list[ChatSessionRead]:
    supabase = get_supabase_client()
    result = supabase.table("chat_sessions").select("*").eq("student_id", student_id).order("updated_at", desc=True).execute()
    
    return [
        ChatSessionRead(
            id=s["id"],
            student_id=s["student_id"],
            school_id=s["school_id"],
            title=s["title"],
            is_active=s.get("is_active", True),
        )
        for s in result.data
    ]


def get_session(session_id: str) -> ChatSessionRead | None:
    supabase = get_supabase_client()
    result = supabase.table("chat_sessions").select("*").eq("id", session_id).execute()
    if not result.data:
        return None
    
    s = result.data[0]
    return ChatSessionRead(
        id=s["id"],
        student_id=s["student_id"],
        school_id=s["school_id"],
        title=s["title"],
        is_active=s.get("is_active", True),
    )


def update_session_title(session_id: str, title: str) -> bool:
    supabase = get_supabase_client()
    result =     supabase.table("chat_sessions").update({
        "title": title,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", session_id).execute()
    return bool(result.data)


def delete_session(session_id: str) -> bool:
    supabase = get_supabase_client()
    result = supabase.table("chat_sessions").delete().eq("id", session_id).execute()
    return bool(result.data)


def add_message(session_id: str, role: str, content: str, sources: list | None = None) -> ChatMessageRead:
    supabase = get_supabase_client()
    
    payload = {
        "session_id": session_id,
        "role": role,
        "content": content,
        "sources": json.dumps(sources or []),
    }
    
    result = supabase.table("chat_messages").insert(payload).execute()
    if not result.data:
        raise ValueError("Erreur lors de l'ajout du message")
    
    row = result.data[0]
    
    supabase.table("chat_sessions").update({"updated_at": datetime.now(timezone.utc).isoformat()}).eq("id", session_id).execute()
    
    return ChatMessageRead(
        id=row["id"],
        session_id=row["session_id"],
        role=row["role"],
        content=row["content"],
        sources=json.loads(row.get("sources", "[]")),
    )


def get_messages_by_session(session_id: str) -> list[ChatMessageRead]:
    supabase = get_supabase_client()
    result = supabase.table("chat_messages").select("*").eq("session_id", session_id).order("created_at").execute()
    
    return [
        ChatMessageRead(
            id=m["id"],
            session_id=m["session_id"],
            role=m["role"],
            content=m["content"],
            sources=json.loads(m.get("sources", "[]")),
        )
        for m in result.data
    ]