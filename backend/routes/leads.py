import logging
from fastapi import APIRouter, HTTPException, Header, Request

from models.schemas import LeadCreate, LeadRead, ErrorResponse
from services.lead_service import create_lead, get_leads_by_school, delete_lead
from services.school_service import get_school_admin, get_school
from utils.rate_limit import limiter

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Leads"])


def _verify_school_admin(school_id: str, admin_key: str | None):
    if not admin_key:
        raise HTTPException(status_code=403, detail="Clé admin requise")
    school = get_school_admin(school_id)
    if not school:
        raise HTTPException(status_code=404, detail=f"École '{school_id}' introuvable")
    if school.admin_key != admin_key:
        raise HTTPException(status_code=403, detail="Clé admin invalide")
    if school.is_suspended:
        raise HTTPException(status_code=403, detail="École suspendue")


@router.post("/lead", response_model=LeadRead, responses={400: {"model": ErrorResponse}, 429: {"model": ErrorResponse}})
@limiter.limit("10/minute")
async def create_lead_endpoint(request: Request, lead: LeadCreate):
    school = get_school(lead.school_id)
    if not school:
        raise HTTPException(status_code=404, detail="École introuvable")
    if school.is_suspended:
        raise HTTPException(status_code=403, detail="École suspendue")
    
    try:
        return create_lead(lead)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        logger.error(f"Lead creation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'enregistrement: {str(e)}")


@router.get("/leads/{school_id}", response_model=list[LeadRead])
async def get_leads(
    school_id: str,
    x_admin_key: str | None = Header(None, alias="X-Admin-Key"),
):
    _verify_school_admin(school_id, x_admin_key)
    try:
        return get_leads_by_school(school_id)
    except Exception as e:
        logger.error(f"Leads fetch error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération: {str(e)}")


@router.delete("/leads/{school_id}/{lead_id}")
async def delete_lead_endpoint(
    school_id: str,
    lead_id: str,
    x_admin_key: str | None = Header(None, alias="X-Admin-Key"),
):
    _verify_school_admin(school_id, x_admin_key)
    try:
        delete_lead(lead_id, school_id)
        return {"message": "Lead supprimé"}
    except Exception as e:
        logger.error(f"Lead delete error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression: {str(e)}")
