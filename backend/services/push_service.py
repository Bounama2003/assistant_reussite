"""Web Push notification service.

Uses pywebpush + VAPID to send push notifications via the Browser Push API.
Relies on a Postgres 'notifications_subscriptions' table to store subscriptions.

Usage:
    from services.push_service import send_to_user, send_to_school_role
    send_to_user("professor", professor_id, "Nouveau feedback", "...")
"""

import json
import logging
from typing import Optional

from pywebpush import webpush, WebPushException
from config.settings import settings
from config.database import get_supabase_client

logger = logging.getLogger(__name__)

VAPID_CLAIMS = {"sub": "mailto:notifications@assistant-reussite.app"}


def _get_vapid_private_key() -> str:
    """Return VAPID private key as base64url-encoded DER (pywebpush/py_vapid format)."""
    import base64
    der = bytes.fromhex(settings.vapid_private_key)
    return base64.urlsafe_b64encode(der).rstrip(b"=").decode()


def _get_vapid_public_key() -> str:
    """Return VAPID public key as a raw base64url string (for the /notifications/public-key endpoint)."""
    import base64
    from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
    from cryptography.hazmat.primitives import serialization
    der = bytes.fromhex(settings.vapid_private_key)
    key = serialization.load_der_private_key(der, password=None)
    pub = key.public_key()
    raw = pub.public_bytes(Encoding.X962, PublicFormat.UncompressedPoint)
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def _build_subscription_info(endpoint: str, p256dh: str, auth: str) -> dict:
    return {
        "endpoint": endpoint,
        "keys": {
            "p256dh": p256dh,
            "auth": auth,
        },
    }


# ── Database helpers ──────────────────────────────────────────────


def subscribe(user_id: str, role: str, endpoint: str, p256dh: str, auth: str) -> bool:
    """Upsert a push subscription (delete then insert to work around PostgREST ON CONFLICT caching issues)."""
    supabase = get_supabase_client()
    supabase.table("notifications_subscriptions") \
        .delete() \
        .eq("user_id", user_id) \
        .eq("role", role) \
        .execute()
    result = supabase.table("notifications_subscriptions").insert({
        "user_id": user_id,
        "role": role,
        "endpoint": endpoint,
        "p256dh_key": p256dh,
        "auth_key": auth,
    }).execute()
    return len(result.data) > 0


def unsubscribe(user_id: str, role: str) -> bool:
    """Remove a push subscription."""
    supabase = get_supabase_client()
    result = supabase.table("notifications_subscriptions") \
        .delete() \
        .eq("user_id", user_id) \
        .eq("role", role) \
        .execute()
    return len(result.data) > 0


def _get_subscriptions(user_id: str, role: str) -> list[dict]:
    """Fetch all subscriptions for a given user+role (normally just one)."""
    supabase = get_supabase_client()
    result = supabase.table("notifications_subscriptions") \
        .select("endpoint, p256dh_key, auth_key") \
        .eq("user_id", user_id) \
        .eq("role", role) \
        .execute()
    return result.data or []


def _get_school_role_subscriptions(role: str, school_id: str) -> list[dict]:
    """Fetch subscriptions for all users of a given role within a school.

    Works for 'professor' and 'student' roles which have school_id in their DB table.
    For 'admin', the school_id is embedded in the admin_key pattern.
    This is best-effort — we query the role-specific table and join with subscriptions.
    """
    supabase = get_supabase_client()
    if role == "professor":
        users = supabase.table("professeurs").select("id").eq("school_id", school_id).execute()
    elif role == "student":
        users = supabase.table("students").select("id").eq("school_id", school_id).execute()
    else:
        return []

    user_ids = [str(u["id"]) for u in (users.data or [])]
    if not user_ids:
        return []

    result = supabase.table("notifications_subscriptions") \
        .select("endpoint, p256dh_key, auth_key") \
        .eq("role", role) \
        .in_("user_id", user_ids) \
        .execute()
    return result.data or []


# ── Sending ────────────────────────────────────────────────────────


def _send(sub: dict, title: str, body: str, data: Optional[dict] = None) -> bool:
    """Send a push notification to a single subscription. Returns True on success."""
    try:
        sub_info = _build_subscription_info(sub["endpoint"], sub["p256dh_key"], sub["auth_key"])
        payload = json.dumps({
            "title": title,
            "body": body,
            "data": data or {},
        })
        webpush(
            subscription_info=sub_info,
            data=payload,
            vapid_private_key=_get_vapid_private_key(),
            vapid_claims=VAPID_CLAIMS,
        )
        return True
    except WebPushException as e:
        # 410 Gone / 404 Not Found = subscription expired
        if e.response and e.response.status_code in (410, 404):
            logger.warning(f"Push subscription expired (endpoint={sub['endpoint'][:50]}…), cleaning up.")
            supabase = get_supabase_client()
            supabase.table("notifications_subscriptions") \
                .delete() \
                .eq("endpoint", sub["endpoint"]) \
                .execute()
        else:
            logger.warning(f"Push send failed: {e}")
        return False


def send_to_user(user_id: str, role: str, title: str, body: str, data: Optional[dict] = None) -> int:
    """Send a push notification to a specific user. Returns count of successful sends."""
    subs = _get_subscriptions(user_id, role)
    if not subs:
        logger.debug(f"No push subscription for {role} {user_id}")
        return 0
    count = 0
    for sub in subs:
        if _send(sub, title, body, data):
            count += 1
    return count


def send_to_school_role(role: str, school_id: str, title: str, body: str, data: Optional[dict] = None) -> int:
    """Broadcast a push notification to all users of a role within a school."""
    subs = _get_school_role_subscriptions(role, school_id)
    if not subs:
        logger.debug(f"No push subscriptions for {role} in school {school_id}")
        return 0
    count = 0
    for sub in subs:
        if _send(sub, title, body, data):
            count += 1
    return count
