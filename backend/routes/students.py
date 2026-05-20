import logging
from fastapi import APIRouter, HTTPException, Header, Request
from typing import Optional

from models.schemas import StudentRead, StudentLogin, ErrorResponse, ConvertLeadRequest, UpdateStudentRequest, ChangePasswordRequest
from services.student_service import authenticate_student, get_student, get_students_by_school, convert_lead_to_student, update_student_password, deactivate_student, verify_password
from services.school_service import get_school_admin, get_school
from config.database import get_supabase_client
from utils.rate_limit import limiter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/student", tags=["Students"])

# ========== Public endpoints ==========
@router.post("/login", response_model=StudentRead, responses={429: {"model": ErrorResponse}})
@limiter.limit("5/minute")
async def login_student(request: Request, credentials: StudentLogin):
    school = get_school(credentials.school_id)
    if not school:
        raise HTTPException(status_code=404, detail="École introuvable")
    if school.is_suspended:
        raise HTTPException(status_code=403, detail="École suspendue")
    
    student = authenticate_student(credentials.phone, credentials.password, credentials.school_id)
    if not student:
        raise HTTPException(status_code=401, detail="Numéro ou mot de passe incorrect")
    return student


# ========== Admin endpoints ========== (MUST be before /{student_id} to avoid route conflicts)
@router.get("/admin/{school_id}/students", response_model=list[StudentRead])
async def list_students(school_id: str, x_admin_key: str | None = Header(None, alias="X-Admin-Key")):
    if not x_admin_key:
        raise HTTPException(status_code=403, detail="Clé admin requise")
    school = get_school_admin(school_id)
    if not school:
        raise HTTPException(status_code=404, detail=f"École '{school_id}' introuvable")
    if school.admin_key != x_admin_key:
        raise HTTPException(status_code=403, detail="Clé admin invalide")
    if school.is_suspended:
        raise HTTPException(status_code=403, detail="École suspendue")
    
    return get_students_by_school(school_id)


@router.post("/admin/{school_id}/convert-lead/{lead_phone}", response_model=StudentRead)
async def convert_lead(
    school_id: str,
    lead_phone: str,
    request: ConvertLeadRequest,
    x_admin_key: str | None = Header(None, alias="X-Admin-Key")
):
    logger.info(f"convert_lead called: school={school_id}, phone={lead_phone!r}")
    if not x_admin_key:
        raise HTTPException(status_code=403, detail="Clé admin requise")
    school = get_school_admin(school_id)
    if not school:
        raise HTTPException(status_code=404, detail=f"École '{school_id}' introuvable")
    if school.admin_key != x_admin_key:
        raise HTTPException(status_code=403, detail="Clé admin invalide")
    if school.is_suspended:
        raise HTTPException(status_code=403, detail="École suspendue")
    
    try:
        student = convert_lead_to_student(school_id, lead_phone, request.classe, request.password)
        if not student:
            raise HTTPException(status_code=404, detail="Lead introuvable ou déjà converti")
        return student
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/admin/{school_id}/students/{student_id}")
async def update_student(
    school_id: str,
    student_id: str,
    request: UpdateStudentRequest,
    x_admin_key: str | None = Header(None, alias="X-Admin-Key")
):
    if not x_admin_key:
        raise HTTPException(status_code=403, detail="Clé admin requise")
    school = get_school_admin(school_id)
    if not school:
        raise HTTPException(status_code=404, detail=f"École '{school_id}' introuvable")
    if school.admin_key != x_admin_key:
        raise HTTPException(status_code=403, detail="Clé admin invalide")
    if school.is_suspended:
        raise HTTPException(status_code=403, detail="École suspendue")
    
    from services.student_service import update_student_classe, update_student_password, set_student_active
    
    try:
        if request.classe is not None:
            update_student_classe(student_id, school_id, request.classe)
        if request.password is not None:
            update_student_password(student_id, school_id, request.password)
        if request.is_active is not None:
            set_student_active(student_id, school_id, request.is_active)
        
        student = get_student(student_id, school_id)
        if not student:
            raise HTTPException(status_code=404, detail="Étudiant introuvable")
        return student
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{school_id}/{student_id}/change-password", responses={400: {"model": ErrorResponse}})
async def change_student_password(
    school_id: str,
    student_id: str,
    request: ChangePasswordRequest,
):
    try:
        supabase = get_supabase_client()
        result = supabase.table("students").select("*").eq("id", student_id).eq("school_id", school_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Étudiant introuvable")
        s = result.data[0]
        if not verify_password(request.current_password, s.get("password_hash") or ""):
            raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")
        update_student_password(student_id, school_id, request.new_password)
        return {"message": "Mot de passe modifié avec succès"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"change_password error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")


# ========== Student profile (MUST be last, catches any remaining /{student_id}) ==========
@router.get("/{school_id}/{student_id}", response_model=StudentRead)
async def get_student_profile(school_id: str, student_id: str):
    student = get_student(student_id, school_id)
    if not student:
        raise HTTPException(status_code=404, detail="Étudiant introuvable")
    return student