import logging
from fastapi import APIRouter, HTTPException

from models.schemas import SchoolRead, ErrorResponse
from services.school_service import get_school

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/school", tags=["Schools"])


@router.get("/{school_id}", response_model=SchoolRead, responses={404: {"model": ErrorResponse}})
async def get_school_endpoint(school_id: str):
    school = get_school(school_id)
    if not school:
        raise HTTPException(status_code=404, detail=f"École '{school_id}' introuvable")
    return school
