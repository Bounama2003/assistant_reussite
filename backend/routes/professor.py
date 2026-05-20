from fastapi import APIRouter, Header, HTTPException, Query, Request
from typing import Optional
from pydantic import BaseModel
from main import limiter
from models.schemas import (
    ProfessorCreate, ProfessorLogin, ProfessorKeyLogin, ProfessorKeyResponse,
    ProfessorRead, ReactionCreate, ReactionRead,
    ProfessorStatsRead, ProfessorDocumentStat, ProfessorQuestionSummary,
)
from services import professor_service
from config.settings import settings


router = APIRouter(prefix="/professor", tags=["Professeur"])
router_admin = APIRouter(prefix="/professors", tags=["Professeurs (Admin)"])


def _require_professor_key(x_professor_key: str = Header(..., alias="X-Professor-Key")):
    if not x_professor_key or x_professor_key == "":
        raise HTTPException(status_code=401, detail="Clé professeur requise")


def _validate_professor_key(x_professor_key: str) -> tuple[str, str]:
    parts = x_professor_key.split("-")
    if len(parts) < 3:
        raise HTTPException(status_code=403, detail="Clé invalide")
    school_id = parts[1]
    proffs = professor_service.get_professors_by_school(school_id)
    for p in proffs:
        if p.professor_key == x_professor_key:
            return p.id, school_id
    raise HTTPException(status_code=403, detail="Clé invalide")


@router.post("/login", response_model=ProfessorRead)
@limiter.limit("10/minute")
async def login(request: Request, data: ProfessorLogin):
    prof = professor_service.authenticate_professor(data.phone, data.password, data.school_id)
    if not prof:
        raise HTTPException(status_code=401, detail="Identifiants invalides")
    return prof


@router.post("/login-key", response_model=ProfessorRead)
@limiter.limit("10/minute")
async def login_key(request: Request, data: ProfessorKeyLogin):
    prof = professor_service.authenticate_professor_key(data.professor_key, data.school_id)
    if not prof:
        raise HTTPException(status_code=401, detail="Clé invalide")
    return prof


@router.get("/me", response_model=ProfessorRead)
@limiter.limit("60/minute")
async def get_me(request: Request, x_professor_key: str = Header(..., alias="X-Professor-Key")):
    professor_id, school_id = _validate_professor_key(x_professor_key)
    prof = professor_service.get_professor(professor_id)
    if not prof:
        raise HTTPException(status_code=403, detail="Clé invalide")
    return prof


@router.get("/dashboard/stats", response_model=ProfessorStatsRead)
@limiter.limit("30/minute")
async def get_stats(
    request: Request,
    x_professor_key: str = Header(..., alias="X-Professor-Key"),
    school_id: str = "",
):
    professor_id, sid = _validate_professor_key(x_professor_key)
    return professor_service.get_professor_stats(professor_id, sid)


@router.get("/dashboard/documents", response_model=list[ProfessorDocumentStat])
@limiter.limit("30/minute")
async def get_documents(
    request: Request,
    x_professor_key: str = Header(..., alias="X-Professor-Key"),
    school_id: str = "",
):
    professor_id, sid = _validate_professor_key(x_professor_key)
    return professor_service.get_professor_documents(professor_id, sid)


@router.get("/dashboard/questions", response_model=list[ProfessorQuestionSummary])
@limiter.limit("30/minute")
async def get_questions(
    request: Request,
    x_professor_key: str = Header(..., alias="X-Professor-Key"),
    school_id: str = "",
    limit: int = 20,
):
    professor_id, sid = _validate_professor_key(x_professor_key)
    return professor_service.get_professor_questions(professor_id, sid, limit)


@router.get("/dashboard/difficulties")
@limiter.limit("30/minute")
async def get_difficulties(
    request: Request,
    x_professor_key: str = Header(..., alias="X-Professor-Key"),
):
    professor_id, sid = _validate_professor_key(x_professor_key)
    return professor_service.get_professor_difficulties(professor_id, sid)


@router.get("/dashboard/top-questions")
@limiter.limit("30/minute")
async def get_top_questions(
    request: Request,
    x_professor_key: str = Header(..., alias="X-Professor-Key"),
    top: int = Query(default=5, ge=1, le=20),
):
    professor_id, sid = _validate_professor_key(x_professor_key)
    return professor_service.get_top_frequent_questions(professor_id, sid, top)


@router.post("/reactions", response_model=ReactionRead)
@limiter.limit("20/minute")
async def create_reaction(
    request: Request,
    data: ReactionCreate,
    x_professor_key: Optional[str] = Header(None, alias="X-Professor-Key"),
    x_student_id: Optional[str] = Header(None, alias="X-Student-Id"),
):
    professor_id = None
    if x_professor_key:
        try:
            professor_id, _ = _validate_professor_key(x_professor_key)
        except HTTPException:
            pass
    try:
        return professor_service.add_reaction(data, professor_id, x_student_id)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router_admin.get("/professors-list/{school_id}", response_model=list[ProfessorRead])
async def list_professors(
    school_id: str,
    x_admin_key: str = Header(..., alias="X-Admin-Key"),
):
    from services.school_service import get_school_admin
    school = get_school_admin(school_id)
    if not school or school.admin_key != x_admin_key:
        raise HTTPException(status_code=403, detail="Clé admin invalide")
    return professor_service.get_professors_by_school(school_id)


@router_admin.post("/school/{school_id}", response_model=ProfessorRead)
async def create_professor(
    school_id: str,
    data: ProfessorCreate,
    x_admin_key: str = Header(..., alias="X-Admin-Key"),
):
    from services.school_service import get_school_admin
    school = get_school_admin(school_id)
    if not school or school.admin_key != x_admin_key:
        raise HTTPException(status_code=403, detail="Clé admin invalide")
    try:
        return professor_service.create_professor(data)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router_admin.get("/school/{school_id}/{professor_id}", response_model=ProfessorRead)
async def get_professor_detail(
    school_id: str,
    professor_id: str,
    x_admin_key: str = Header(..., alias="X-Admin-Key"),
):
    from services.school_service import get_school_admin
    school = get_school_admin(school_id)
    if not school or school.admin_key != x_admin_key:
        raise HTTPException(status_code=403, detail="Clé admin invalide")
    prof = professor_service.get_professor(professor_id)
    if not prof:
        raise HTTPException(status_code=404, detail="Professeur non trouvé")
    return prof


@router_admin.post("/{professor_id}/reset-key", response_model=ProfessorKeyResponse)
async def reset_professor_key(
    professor_id: str,
    school_id: str,
    x_admin_key: str = Header(..., alias="X-Admin-Key"),
):
    from services.school_service import get_school_admin
    school = get_school_admin(school_id)
    if not school or school.admin_key != x_admin_key:
        raise HTTPException(status_code=403, detail="Clé admin invalide")
    result = professor_service.reset_professor_key(professor_id, school_id)
    if not result:
        raise HTTPException(status_code=404, detail="Professeur non trouvé")
    return result


class NotificationItem(BaseModel):
    id: str
    type: str
    title: str
    message: str
    created_at: Optional[str] = None


@router.get("/notifications", response_model=list[NotificationItem])
@limiter.limit("30/minute")
async def get_notifications(
    request: Request,
    x_professor_key: str = Header(..., alias="X-Professor-Key"),
    limit: int = Query(default=10, le=50),
):
    professor_id, sid = _validate_professor_key(x_professor_key)
    notifications = professor_service.get_notifications(professor_id, sid, limit)
    return notifications