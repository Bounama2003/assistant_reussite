import logging
from fastapi import APIRouter, HTTPException, Header, Query, Request
from models.schemas import SchoolCreate, SchoolUpdate, SchoolAdminRead, ErrorResponse
from main import limiter
from services.school_service import (
    get_all_schools_admin,
    get_school_admin,
    create_school,
    update_school,
    delete_school,
    reset_admin_key,
    get_global_stats,
    suspend_school,
    activate_school,
)
from config.settings import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["Super Admin"])


def verify_super_admin(key: str | None):
    if (key or "") != settings.super_admin_key:
        raise HTTPException(status_code=403, detail="Clé super-admin invalide")


@router.get("/schools", response_model=list[SchoolAdminRead])
@limiter.limit("30/minute")
async def list_schools(request: Request, key: str = Header(..., alias="X-Super-Admin-Key")):
    verify_super_admin(key)
    return get_all_schools_admin()


@router.post("/schools", response_model=SchoolAdminRead, responses={400: {"model": ErrorResponse}, 409: {"model": ErrorResponse}})
@limiter.limit("10/minute")
async def create_new_school(
    request: Request,
    data: SchoolCreate,
    key: str = Header(..., alias="X-Super-Admin-Key"),
):
    verify_super_admin(key)
    try:
        import secrets
        admin_key = f"admin-{data.id}-{secrets.token_urlsafe(8)}"
        return create_school(data, admin_key)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.get("/schools/{school_id}", response_model=SchoolAdminRead, responses={404: {"model": ErrorResponse}})
@limiter.limit("30/minute")
async def get_school_detail(
    request: Request,
    school_id: str,
    key: str = Header(..., alias="X-Super-Admin-Key"),
):
    verify_super_admin(key)
    school = get_school_admin(school_id)
    if not school:
        raise HTTPException(status_code=404, detail=f"École '{school_id}' introuvable")
    return school


@router.put("/schools/{school_id}", response_model=SchoolAdminRead, responses={404: {"model": ErrorResponse}})
@limiter.limit("20/minute")
async def update_school_endpoint(
    request: Request,
    school_id: str,
    data: SchoolUpdate,
    key: str = Header(..., alias="X-Super-Admin-Key"),
):
    verify_super_admin(key)
    school = update_school(school_id, data)
    if not school:
        raise HTTPException(status_code=404, detail=f"École '{school_id}' introuvable")
    return school


@router.delete("/schools/{school_id}")
@limiter.limit("10/minute")
async def delete_school_endpoint(
    request: Request,
    school_id: str,
    key: str = Header(..., alias="X-Super-Admin-Key"),
):
    verify_super_admin(key)
    if not delete_school(school_id):
        raise HTTPException(status_code=404, detail=f"École '{school_id}' introuvable")
    return {"message": f"École '{school_id}' supprimée"}


@router.post("/schools/{school_id}/reset-key", responses={404: {"model": ErrorResponse}})
@limiter.limit("10/minute")
async def reset_key(
    request: Request,
    school_id: str,
    key: str = Header(..., alias="X-Super-Admin-Key"),
):
    verify_super_admin(key)
    new_key = reset_admin_key(school_id)
    if not new_key:
        raise HTTPException(status_code=404, detail=f"École '{school_id}' introuvable")
    return {"admin_key": new_key}


@router.get("/stats")
@limiter.limit("30/minute")
async def global_stats(request: Request, key: str = Header(..., alias="X-Super-Admin-Key")):
    verify_super_admin(key)
    return get_global_stats()


@router.post("/schools/{school_id}/suspend")
@limiter.limit("10/minute")
async def suspend_school_endpoint(
    request: Request,
    school_id: str,
    key: str = Header(..., alias="X-Super-Admin-Key"),
):
    verify_super_admin(key)
    school = suspend_school(school_id)
    if not school:
        raise HTTPException(status_code=404, detail=f"École '{school_id}' introuvable")
    return school


@router.post("/schools/{school_id}/activate")
@limiter.limit("10/minute")
async def activate_school_endpoint(
    request: Request,
    school_id: str,
    key: str = Header(..., alias="X-Super-Admin-Key"),
):
    verify_super_admin(key)
    school = activate_school(school_id)
    if not school:
        raise HTTPException(status_code=404, detail=f"École '{school_id}' introuvable")
    return school
