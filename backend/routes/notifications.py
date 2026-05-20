"""Notification routes — subscription management + public key endpoint."""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel
from main import limiter

from services.push_service import subscribe, unsubscribe, send_to_user, _get_vapid_public_key

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notifications", tags=["Notifications"])


class SubscribeRequest(BaseModel):
    endpoint: str
    p256dh_key: str
    auth_key: str


class UnsubscribeRequest(BaseModel):
    endpoint: str


# ── Helpers: resolve user_id + role from auth headers ─────────────


def _resolve_user(
    x_student_id: Optional[str] = None,
    x_professor_key: Optional[str] = None,
    x_admin_key: Optional[str] = None,
    x_super_admin_key: Optional[str] = None,
) -> tuple[str, str]:
    """Return (user_id, role) from the provided auth headers."""
    if x_super_admin_key:
        from config.settings import settings
        if x_super_admin_key == settings.super_admin_key:
            return x_super_admin_key, "superadmin"
        raise HTTPException(status_code=403, detail="Clé super admin invalide")

    if x_admin_key:
        # admin key format: admin-{school_id}-{token}
        parts = x_admin_key.split("-")
        if len(parts) < 3:
            raise HTTPException(status_code=403, detail="Clé admin invalide")
        return x_admin_key, "admin"

    if x_professor_key:
        from services import professor_service
        parts = x_professor_key.split("-")
        if len(parts) < 3:
            raise HTTPException(status_code=403, detail="Clé professeur invalide")
        school_id = parts[1]
        proffs = professor_service.get_professors_by_school(school_id)
        for p in proffs:
            if p.professor_key == x_professor_key:
                return p.id, "professor"
        raise HTTPException(status_code=403, detail="Clé professeur invalide")

    if x_student_id:
        return x_student_id, "student"

    raise HTTPException(status_code=401, detail="Authentification requise pour les notifications push")


# ── Endpoints ──────────────────────────────────────────────────────


@router.get("/public-key")
async def get_public_key():
    """Return the VAPID public key so the frontend can subscribe."""
    return {"public_key": _get_vapid_public_key()}


@router.post("/subscribe")
@limiter.limit("10/minute")
async def subscribe_push(
    request: Request,
    data: SubscribeRequest,
    x_student_id: Optional[str] = Header(None, alias="X-Student-Id"),
    x_professor_key: Optional[str] = Header(None, alias="X-Professor-Key"),
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
    x_super_admin_key: Optional[str] = Header(None, alias="X-Super-Admin-Key"),
):
    """Register a push subscription for the authenticated user."""
    user_id, role = _resolve_user(x_student_id, x_professor_key, x_admin_key, x_super_admin_key)
    ok = subscribe(user_id, role, data.endpoint, data.p256dh_key, data.auth_key)
    if not ok:
        raise HTTPException(status_code=500, detail="Échec de l'enregistrement de l'abonnement push")
    logger.info(f"Push subscription saved for {role} {user_id[:20]}…")
    return {"status": "ok"}


@router.post("/unsubscribe")
@limiter.limit("10/minute")
async def unsubscribe_push(
    request: Request,
    data: UnsubscribeRequest,
    x_student_id: Optional[str] = Header(None, alias="X-Student-Id"),
    x_professor_key: Optional[str] = Header(None, alias="X-Professor-Key"),
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
    x_super_admin_key: Optional[str] = Header(None, alias="X-Super-Admin-Key"),
):
    """Remove a push subscription for the authenticated user."""
    user_id, role = _resolve_user(x_student_id, x_professor_key, x_admin_key, x_super_admin_key)
    ok = unsubscribe(user_id, role)
    logger.info(f"Push subscription removed for {role} {user_id[:20]}…")
    return {"status": "ok"}


@router.post("/test")
@limiter.limit("5/minute")
async def test_push(
    request: Request,
    x_student_id: Optional[str] = Header(None, alias="X-Student-Id"),
    x_professor_key: Optional[str] = Header(None, alias="X-Professor-Key"),
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
    x_super_admin_key: Optional[str] = Header(None, alias="X-Super-Admin-Key"),
):
    """Send a test push notification to the authenticated user."""
    user_id, role = _resolve_user(x_student_id, x_professor_key, x_admin_key, x_super_admin_key)
    count = send_to_user(
        user_id, role,
        title="🔔 Notification de test",
        body="Si vous lisez ceci, le push fonctionne !",
        data={"url": None},
    )
    if count == 0:
        return {"status": "no_subscription", "message": "Aucun abonnement push trouvé pour cet utilisateur. Assurez-vous d'avoir autorisé les notifications dans le navigateur."}
    return {"status": "sent", "count": count}
