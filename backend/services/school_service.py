import secrets
from datetime import datetime, timezone
from typing import Any
from config.database import get_supabase_client
from models.schemas import SchoolRead, SchoolAdminRead, SchoolCreate, SchoolUpdate


def get_school(school_id: str) -> SchoolRead | None:
    supabase = get_supabase_client()
    result = supabase.table("schools").select("*").eq("id", school_id).execute()
    if not result.data:
        return None
    row = result.data[0]
    return SchoolRead(
        id=row["id"],
        name=row["name"],
        logo_url=row.get("logo_url"),
        primary_color=row.get("primary_color", "#2563EB"),
        nom_directeur=row.get("nom_directeur"),
        directeur_fondateur=row.get("directeur_fondateur"),
        annee_scolaire_active=row.get("annee_scolaire_active", "2025-2026"),
        is_suspended=row.get("is_suspended", False),
    )


def _exact_count() -> str:
    return "exact"


def get_schools_admin() -> list[SchoolAdminRead]:
    supabase = get_supabase_client()
    result = supabase.table("schools").select("*").order("created_at", desc=True).execute()

    _, doc_counts = _count_all_docs(supabase)

    # Single query for all lead counts instead of N individual queries
    leads_result = supabase.table("leads").select("school_id").execute()
    lead_counts: dict[str, int] = {}
    for l in leads_result.data or []:
        sid = l.get("school_id")
        if sid:
            lead_counts[sid] = lead_counts.get(sid, 0) + 1

    schools = []
    for row in result.data:
        doc_count = doc_counts.get(row["id"], 0)
        schools.append(SchoolAdminRead(
            id=row["id"],
            name=row["name"],
            logo_url=row.get("logo_url"),
            primary_color=row.get("primary_color", "#2563EB"),
            admin_key=row.get("admin_key", ""),
            contact_email=row.get("contact_email"),
            created_at=row.get("created_at"),
            updated_at=row.get("updated_at"),
            lead_count=lead_counts.get(row["id"], 0),
            document_count=doc_count,
            is_suspended=row.get("is_suspended", False),
        ))
    return schools


def get_school_admin(school_id: str) -> SchoolAdminRead | None:
    supabase = get_supabase_client()
    result = supabase.table("schools").select("*").eq("id", school_id).execute()
    if not result.data:
        return None
    row = result.data[0]
    lead_count = supabase.table("leads").select("id", count=_exact_count()).eq("school_id", row["id"]).execute().count
    doc_count = _count_docs_for_school(supabase, row["id"])
    return SchoolAdminRead(
        id=row["id"],
        name=row["name"],
        logo_url=row.get("logo_url"),
        primary_color=row.get("primary_color", "#2563EB"),
        admin_key=row.get("admin_key", ""),
        contact_email=row.get("contact_email"),
        nom_directeur=row.get("nom_directeur"),
        directeur_fondateur=row.get("directeur_fondateur"),
        annee_scolaire_active=row.get("annee_scolaire_active", "2025-2026"),
        original_id=row.get("original_id"),
        is_suspended=row.get("is_suspended", False),
        created_at=row.get("created_at"),
        updated_at=row.get("updated_at"),
        lead_count=lead_count or 0,
        document_count=doc_count,
    )


def _count_docs_for_school(supabase, school_id: str) -> int:
    try:
        result = supabase.table("data_documents").select("metadata_").execute()
        count = 0
        for row in result.data:
            meta = row.get("metadata_", {})
            if meta.get("school_id") == school_id:
                count += 1
        return count
    except Exception:
        return 0


def _count_all_docs(supabase):
    try:
        result = supabase.table("data_documents").select("metadata_").execute()
        total_count = len(result.data)
        counts = {}
        for row in result.data:
            meta = row.get("metadata_", {})
            sid = meta.get("school_id")
            if sid:
                counts[sid] = counts.get(sid, 0) + 1
        return total_count, counts
    except Exception:
        return 0, {}


def create_school(data: SchoolCreate, admin_key: str) -> SchoolAdminRead:
    supabase = get_supabase_client()
    admin_key_hash = secrets.token_urlsafe(16)
    payload = {
        "id": data.id,
        "name": data.name,
        "logo_url": data.logo_url,
        "primary_color": data.primary_color,
        "admin_key": admin_key,
        "contact_email": data.contact_email,
    }
    result = supabase.table("schools").insert(payload).execute()
    if not result.data:
        raise ValueError("Erreur lors de la création de l'école")
    row = result.data[0]
    return SchoolAdminRead(
        id=row["id"],
        name=row["name"],
        logo_url=row.get("logo_url"),
        primary_color=row.get("primary_color", "#2563EB"),
        admin_key=admin_key,
        nom_directeur=row.get("nom_directeur"),
        directeur_fondateur=row.get("directeur_fondateur"),
        annee_scolaire_active=row.get("annee_scolaire_active", "2025-2026"),
    )


def update_school(school_id: str, data: SchoolUpdate) -> SchoolAdminRead | None:
    supabase = get_supabase_client()
    update_data = {}
    if data.name is not None:
        update_data["name"] = data.name
    if data.logo_url is not None:
        update_data["logo_url"] = data.logo_url
    if data.primary_color is not None:
        update_data["primary_color"] = data.primary_color
    if data.contact_email is not None:
        update_data["contact_email"] = data.contact_email
    if data.nom_directeur is not None:
        update_data["nom_directeur"] = data.nom_directeur
    if data.directeur_fondateur is not None:
        update_data["directeur_fondateur"] = data.directeur_fondateur
    if data.annee_scolaire_active is not None:
        update_data["annee_scolaire_active"] = data.annee_scolaire_active
    if data.is_suspended is not None:
        update_data["is_suspended"] = data.is_suspended
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = supabase.table("schools").update(update_data).eq("id", school_id).execute()
    if not result.data:
        return None
    row = result.data[0]
    lead_count = supabase.table("leads").select("id", count=_exact_count()).eq("school_id", school_id).execute().count or 0
    doc_count = _count_docs_for_school(supabase, school_id)
    return SchoolAdminRead(
        id=row["id"],
        name=row["name"],
        logo_url=row.get("logo_url"),
        primary_color=row.get("primary_color", "#2563EB"),
        admin_key=row.get("admin_key", ""),
        contact_email=row.get("contact_email"),
        created_at=row.get("created_at"),
        updated_at=row.get("updated_at"),
        lead_count=lead_count,
        document_count=doc_count,
    )


def get_all_schools() -> list[dict]:
    supabase = get_supabase_client()
    total_leads = supabase.table("leads").select("id", count=_exact_count()).execute().count or 0
    _, doc_counts = _count_all_docs(supabase)
    total_docs = sum(doc_counts.values())
    result = supabase.table("schools").select("*").execute()

    # Single query for all lead counts
    leads_result = supabase.table("leads").select("school_id").execute()
    lead_counts: dict[str, int] = {}
    for l in leads_result.data or []:
        sid = l.get("school_id")
        if sid:
            lead_counts[sid] = lead_counts.get(sid, 0) + 1

    schools = []
    for s in result.data:
        schools.append({
            "id": s["id"],
            "name": s["name"],
            "primary_color": s.get("primary_color", "#2563EB"),
            "lead_count": lead_counts.get(s["id"], 0),
            "document_count": doc_counts.get(s["id"], 0),
            "is_suspended": s.get("is_suspended", False),
        })
    return {
        "total_schools": len(schools),
        "total_leads": total_leads,
        "total_documents": total_docs,
        "schools": schools,
    }


def delete_school(school_id: str) -> bool:
    supabase = get_supabase_client()
    result = supabase.table("schools").delete().eq("id", school_id).execute()
    return bool(result.data)


def get_all_schools_admin() -> list[SchoolAdminRead]:
    return get_schools_admin()


def reset_admin_key(school_id: str) -> str | None:
    supabase = get_supabase_client()
    result = supabase.table("schools").select("id").eq("id", school_id).execute()
    if not result.data:
        return None
    new_key = f"admin-{school_id}-{secrets.token_urlsafe(8)}"
    supabase.table("schools").update({"admin_key": new_key}).eq("id", school_id).execute()
    return new_key


def get_global_stats() -> dict:
    return get_all_schools()


def suspend_school(school_id: str) -> SchoolAdminRead | None:
    supabase = get_supabase_client()
    supabase.table("schools").update({"is_suspended": True}).eq("id", school_id).execute()
    return get_school_admin(school_id)


def activate_school(school_id: str) -> SchoolAdminRead | None:
    supabase = get_supabase_client()
    supabase.table("schools").update({"is_suspended": False}).eq("id", school_id).execute()
    return get_school_admin(school_id)