import logging
import json
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from models.schemas import ChatRequest, ChatResponse, Source, ErrorResponse
from rag.engine import query_rag, query_rag_stream
from services.school_service import get_school
from main import limiter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse, responses={400: {"model": ErrorResponse}, 429: {"model": ErrorResponse}})
@limiter.limit("30/minute")
async def chat(request: Request, chat_request: ChatRequest):
    school = get_school(chat_request.school_id)
    if not school:
        raise HTTPException(status_code=404, detail="École introuvable")
    if school.is_suspended:
        raise HTTPException(status_code=403, detail="École suspendue")
    
    try:
        answer, sources = query_rag(
            chat_request.question,
            chat_request.school_id,
            student_id=chat_request.student_id or None,
            student_classe=chat_request.student_classe or None,
            student_name=chat_request.student_name or None,
            conversation_history=chat_request.conversation_history or None
        )

        msg = None
        if chat_request.session_id and chat_request.student_id:
            try:
                from services.chat_session_service import add_message
                add_message(chat_request.session_id, "user", chat_request.question)
                msg = add_message(chat_request.session_id, "assistant", answer, sources)
            except Exception as save_err:
                logger.error(f"Failed to save messages: {save_err}")
                msg = None
        
        return ChatResponse(
            answer=answer,
            sources=[Source(**s) for s in sources],
            message_id=msg.id if msg else None,
        )
    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erreur du moteur IA: {str(e)}")


@router.post("/stream")
@limiter.limit("30/minute")
async def chat_stream(request: Request, chat_request: ChatRequest):
    school = get_school(chat_request.school_id)
    if not school:
        raise HTTPException(status_code=404, detail="École introuvable")
    if school.is_suspended:
        raise HTTPException(status_code=403, detail="École suspendue")

    async def event_generator():
        collected_tokens = []
        sources_final = []
        message_id = None

        try:
            for sse_event in query_rag_stream(
                chat_request.question,
                chat_request.school_id,
                student_id=chat_request.student_id or None,
                student_classe=chat_request.student_classe or None,
                student_name=chat_request.student_name or None,
                conversation_history=chat_request.conversation_history or None
            ):
                yield sse_event

                # Parse the event to collect tokens for persistence
                if sse_event.startswith("data: "):
                    try:
                        data = json.loads(sse_event[6:])
                        if data.get("type") == "token":
                            collected_tokens.append(data["content"])
                        elif data.get("type") == "sources":
                            sources_final = data.get("sources", [])
                    except json.JSONDecodeError:
                        pass

            # Persist messages after streaming completes
            if chat_request.session_id and chat_request.student_id:
                try:
                    from services.chat_session_service import add_message
                    full_answer = "".join(collected_tokens)
                    add_message(chat_request.session_id, "user", chat_request.question)
                    saved = add_message(chat_request.session_id, "assistant", full_answer, sources_final)
                    message_id = saved.id if saved else None
                except Exception as save_err:
                    logger.error(f"Failed to save stream messages: {save_err}")

            yield f"data: {json.dumps({'type': 'done', 'message_id': message_id})}\n\n"

        except Exception as e:
            logger.error(f"Chat stream error: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'content': 'Erreur lors du streaming'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
