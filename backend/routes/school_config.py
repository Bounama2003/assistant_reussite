import logging
from fastapi import APIRouter, HTTPException, Header, Query
from typing import Optional

from models.schemas import (
    SchoolLevelCreate, SchoolLevelRead,
    SchoolClassCreate, SchoolClassRead,
    SchoolCourseCreate, SchoolCourseRead, ErrorResponse,
)
from services import school_config_service
from services.school_service import get_school_admin

logger = logging.getLogger(__name__)
router = APIRouter(tags=["School Config"])


def _verify_admin(school_id: str, admin_key: str | None):
    if not admin_key:
        raise HTTPException(status_code=403, detail="Clé admin requise")
    school = get_school_admin(school_id)
    if not school:
        raise HTTPException(status_code=404, detail="École introuvable")
    if school.admin_key != admin_key:
        raise HTTPException(status_code=403, detail="Clé admin invalide")


# ==================== LEVELS ====================

@router.post("/school/{school_id}/levels", response_model=SchoolLevelRead,
             responses={400: {"model": ErrorResponse}, 403: {"model": ErrorResponse}})
async def create_level(
    school_id: str,
    data: SchoolLevelCreate,
    x_admin_key: str | None = Header(None, alias="X-Admin-Key"),
):
    _verify_admin(school_id, x_admin_key)
    try:
        return school_config_service.create_level(school_id, data)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.get("/school/{school_id}/levels", response_model=list[SchoolLevelRead])
async def list_levels(school_id: str):
    return school_config_service.get_levels_by_school(school_id)


@router.delete("/school/{school_id}/levels/{level_id}")
async def delete_level(
    school_id: str,
    level_id: str,
    x_admin_key: str | None = Header(None, alias="X-Admin-Key"),
):
    _verify_admin(school_id, x_admin_key)
    if not school_config_service.delete_level(level_id, school_id):
        raise HTTPException(status_code=404, detail="Niveau introuvable")
    return {"message": "Niveau supprimé"}


# ==================== CLASSES ====================

@router.get("/school/{school_id}/classes", response_model=list[SchoolClassRead])
async def list_classes(school_id: str):
    return school_config_service.get_classes_by_school(school_id)


@router.post("/school/{school_id}/classes", response_model=SchoolClassRead,
             responses={400: {"model": ErrorResponse}, 403: {"model": ErrorResponse}})
async def create_class(
    school_id: str,
    data: SchoolClassCreate,
    x_admin_key: str | None = Header(None, alias="X-Admin-Key"),
):
    _verify_admin(school_id, x_admin_key)
    try:
        return school_config_service.create_class(school_id, data)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.put("/school/{school_id}/classes/{class_id}", response_model=SchoolClassRead)
async def update_class(
    school_id: str,
    class_id: str,
    data: SchoolClassCreate,
    x_admin_key: str | None = Header(None, alias="X-Admin-Key"),
):
    _verify_admin(school_id, x_admin_key)
    result = school_config_service.update_class(class_id, school_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Classe introuvable")
    return result


@router.delete("/school/{school_id}/classes/{class_id}")
async def delete_class(
    school_id: str,
    class_id: str,
    x_admin_key: str | None = Header(None, alias="X-Admin-Key"),
):
    _verify_admin(school_id, x_admin_key)
    if not school_config_service.delete_class(class_id, school_id):
        raise HTTPException(status_code=404, detail="Classe introuvable")
    return {"message": "Classe supprimée"}


# ==================== COURSES ====================

@router.get("/school/{school_id}/courses", response_model=list[SchoolCourseRead])
async def list_courses(school_id: str):
    return school_config_service.get_courses_by_school(school_id)


@router.post("/school/{school_id}/courses", response_model=SchoolCourseRead,
             responses={400: {"model": ErrorResponse}, 403: {"model": ErrorResponse}})
async def create_course(
    school_id: str,
    data: SchoolCourseCreate,
    x_admin_key: str | None = Header(None, alias="X-Admin-Key"),
):
    _verify_admin(school_id, x_admin_key)
    try:
        return school_config_service.create_course(school_id, data)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.put("/school/{school_id}/courses/{course_id}", response_model=SchoolCourseRead)
async def update_course(
    school_id: str,
    course_id: str,
    data: SchoolCourseCreate,
    x_admin_key: str | None = Header(None, alias="X-Admin-Key"),
):
    _verify_admin(school_id, x_admin_key)
    result = school_config_service.update_course(course_id, school_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Cours introuvable")
    return result


@router.delete("/school/{school_id}/courses/{course_id}")
async def delete_course(
    school_id: str,
    course_id: str,
    x_admin_key: str | None = Header(None, alias="X-Admin-Key"),
):
    _verify_admin(school_id, x_admin_key)
    if not school_config_service.delete_course(course_id, school_id):
        raise HTTPException(status_code=404, detail="Cours introuvable")
    return {"message": "Cours supprimé"}
