import logging
from fastapi import APIRouter, Header, HTTPException
from collections import defaultdict
from datetime import datetime, timedelta

from config.database import get_supabase_client
from services.school_service import get_school_admin

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Statistics"])


def _verify_school_admin(school_id: str, admin_key: str | None):
    if not admin_key:
        raise HTTPException(status_code=403, detail="Clé admin requise")
    school = get_school_admin(school_id)
    if not school:
        raise HTTPException(status_code=404, detail=f"École '{school_id}' introuvable")
    if school.admin_key != admin_key:
        raise HTTPException(status_code=403, detail="Clé admin invalide")


def _get_leads_stats(supabase, school_id: str) -> dict:
    thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()

    # All leads (for conversion calculation)
    all_result = supabase.table("leads") \
        .select("created_at, serie, converted, converted_at") \
        .eq("school_id", school_id) \
        .execute()

    # Recent leads (last 30 days)
    recent_result = supabase.table("leads") \
        .select("created_at, serie") \
        .eq("school_id", school_id) \
        .eq("converted", False) \
        .gte("created_at", thirty_days_ago) \
        .execute()

    leads_by_day = defaultdict(int)
    leads_by_serie = defaultdict(int)

    for lead in recent_result.data:
        day = lead["created_at"][:10]
        leads_by_day[day] += 1
        serie = lead.get("serie", "Non spécifié")
        leads_by_serie[serie] += 1

    # Calculate conversion stats
    total_leads = len(all_result.data)
    converted = sum(1 for l in all_result.data if l.get("converted"))
    conversion_rate = round((converted / total_leads) * 100, 1) if total_leads > 0 else 0

    return {
        "by_day": dict(sorted(leads_by_day.items())),
        "by_serie": dict(leads_by_serie),
        "total": len(recent_result.data),
        "total_all": total_leads,
        "converted": converted,
        "conversion_rate": conversion_rate,
    }


def _get_documents_stats(supabase, school_id: str) -> dict:
    # LlamaIndex uses 'data_documents' as default table name and 'metadata_' as column name
    try:
        result = supabase.table("data_documents") \
            .select("metadata_") \
            .execute()
        data = result.data
        col = "metadata_"
    except Exception:
        # Fallback to 'documents' table and 'metadata' column if 'data_documents' doesn't exist
        try:
            result = supabase.table("documents") \
                .select("metadata") \
                .execute()
            data = result.data
            col = "metadata"
        except Exception:
            data = []
            col = "metadata"

    docs_by_matiere = defaultdict(int)
    total_chunks = 0
    filenames = set()

    for doc in data:
        metadata = doc.get(col, {})
        if metadata.get("school_id") == school_id:
            matiere = metadata.get("matiere", "Non spécifié")
            filename = metadata.get("filename", "")
            if filename:
                filenames.add(filename)
                docs_by_matiere[matiere] += 1
            total_chunks += 1

    return {
        "by_matiere": dict(docs_by_matiere),
        "total_chunks": total_chunks,
        "total_files": len(filenames)
    }


def _get_chat_stats(supabase, school_id: str) -> dict:
    sessions_result = supabase.table("chat_sessions") \
        .select("id, created_at") \
        .eq("school_id", school_id) \
        .execute()

    thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
    session_ids = [s["id"] for s in sessions_result.data]

    messages_by_day = defaultdict(int)
    # Heatmap: day_of_week (0-6) x hour (0-23)
    heatmap: dict[str, dict[str, int]] = {}
    day_names = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

    if session_ids:
        messages_result = supabase.table("chat_messages") \
            .select("created_at, session_id") \
            .in_("session_id", session_ids) \
            .gte("created_at", thirty_days_ago) \
            .execute()

        for msg in messages_result.data:
            day = msg["created_at"][:10]
            messages_by_day[day] += 1

            # Parse timestamp for heatmap
            try:
                dt = datetime.fromisoformat(msg["created_at"])
                dow = day_names[dt.weekday()]
                hour = str(dt.hour)
                if dow not in heatmap:
                    heatmap[dow] = {}
                heatmap[dow][hour] = heatmap[dow].get(hour, 0) + 1
            except (ValueError, KeyError):
                pass

    return {
        "total_sessions": len(sessions_result.data),
        "total_messages": sum(messages_by_day.values()),
        "messages_by_day": dict(sorted(messages_by_day.items())),
        "heatmap": heatmap,
    }


@router.get("/stats/{school_id}")
async def get_school_stats(
    school_id: str,
    x_admin_key: str | None = Header(None, alias="X-Admin-Key"),
):
    _verify_school_admin(school_id, x_admin_key)

    supabase = get_supabase_client()

    try:
        leads_stats = _get_leads_stats(supabase, school_id)
        docs_stats = _get_documents_stats(supabase, school_id)
        chat_stats = _get_chat_stats(supabase, school_id)

        return {
            "school_id": school_id,
            "leads": leads_stats,
            "documents": docs_stats,
            "chats": chat_stats,
        }
    except Exception as e:
        logger.error(f"Stats error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erreur lors du calcul des statistiques: {str(e)}")


def _get_documents_count(supabase, school_id: str) -> int:
    try:
        # Try LlamaIndex table first
        result = supabase.table("data_documents") \
            .select("id, metadata_", count="exact") \
            .execute()
        count = 0
        if result.data:
            for doc in result.data:
                if doc.get("metadata_", {}).get("school_id") == school_id:
                    count += 1
        return count
    except Exception:
        # Fallback to manual table
        try:
            result = supabase.table("documents") \
                .select("id, metadata", count="exact") \
                .execute()
            count = 0
            if result.data:
                for doc in result.data:
                    if doc.get("metadata", {}).get("school_id") == school_id:
                        count += 1
            return count
        except Exception:
            return 0


@router.get("/documents/{school_id}")
async def get_school_documents(school_id: str):
    supabase = get_supabase_client()
    
    try:
        # Try LlamaIndex table
        try:
            result = supabase.table("data_documents") \
                .select("metadata_") \
                .execute()
            data = result.data
            col = "metadata_"
        except Exception:
            # Fallback
            result = supabase.table("documents") \
                .select("metadata") \
                .execute()
            data = result.data
            col = "metadata"
        
        docs = []
        for doc in data:
            metadata = doc.get(col, {})
            if metadata.get("school_id") == school_id:
                docs.append({
                    "filename": metadata.get("filename", "Document"),
                    "matiere": metadata.get("matiere", "Non spécifié"),
                    "classe": metadata.get("classe", "Non spécifié"),
                })
        
        return {"count": len(docs), "documents": docs}
    except Exception as e:
        logger.error(f"Get documents error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")
