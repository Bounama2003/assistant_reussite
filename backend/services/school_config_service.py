import logging
from typing import Optional
from config.database import get_supabase_client
from models.schemas import (
    SchoolLevelCreate, SchoolLevelRead,
    SchoolClassCreate, SchoolClassRead,
    SchoolCourseCreate, SchoolCourseRead,
)

logger = logging.getLogger(__name__)


# ==================== LEVELS ====================

def create_level(school_id: str, data: SchoolLevelCreate) -> SchoolLevelRead:
    supabase = get_supabase_client()
    result = supabase.table("school_levels").insert({
        "school_id": school_id,
        "nom_niveau": data.nom_niveau,
    }).execute()
    if not result.data:
        raise ValueError("Erreur lors de la création du niveau")
    row = result.data[0]
    return SchoolLevelRead(
        id=row["id"],
        school_id=row["school_id"],
        nom_niveau=row["nom_niveau"],
        created_at=row.get("created_at"),
    )


def get_levels_by_school(school_id: str) -> list[SchoolLevelRead]:
    supabase = get_supabase_client()
    result = supabase.table("school_levels") \
        .select("*") \
        .eq("school_id", school_id) \
        .order("created_at") \
        .execute()
    return [
        SchoolLevelRead(
            id=row["id"],
            school_id=row["school_id"],
            nom_niveau=row["nom_niveau"],
            created_at=row.get("created_at"),
        )
        for row in result.data
    ]


def delete_level(level_id: str, school_id: str) -> bool:
    supabase = get_supabase_client()
    result = supabase.table("school_levels").delete() \
        .eq("id", level_id).eq("school_id", school_id).execute()
    return bool(result.data)


# ==================== CLASSES ====================

def create_class(school_id: str, data: SchoolClassCreate) -> SchoolClassRead:
    supabase = get_supabase_client()
    payload = {
        "school_id": school_id,
        "nom_classe": data.nom_classe,
    }
    if data.professeur_responsable:
        payload["professeur_responsable"] = data.professeur_responsable

    result = supabase.table("school_classes").insert(payload).execute()
    if not result.data:
        raise ValueError("Erreur lors de la création de la classe")
    row = result.data[0]
    return _row_to_class(row, supabase)


def get_classes_by_school(school_id: str) -> list[SchoolClassRead]:
    supabase = get_supabase_client()
    result = supabase.table("school_classes") \
        .select("*") \
        .eq("school_id", school_id) \
        .order("created_at") \
        .execute()
    return [_row_to_class(row, supabase) for row in result.data]


def update_class(class_id: str, school_id: str, data: SchoolClassCreate) -> Optional[SchoolClassRead]:
    supabase = get_supabase_client()
    payload = {"nom_classe": data.nom_classe}
    if data.professeur_responsable is not None:
        payload["professeur_responsable"] = data.professeur_responsable

    result = supabase.table("school_classes").update(payload) \
        .eq("id", class_id).eq("school_id", school_id).execute()
    if not result.data:
        return None
    return _row_to_class(result.data[0], supabase)


def delete_class(class_id: str, school_id: str) -> bool:
    supabase = get_supabase_client()
    result = supabase.table("school_classes").delete() \
        .eq("id", class_id).eq("school_id", school_id).execute()
    return bool(result.data)


def _row_to_class(row: dict, supabase=None) -> SchoolClassRead:
    professeur_nom = None
    prof_id = row.get("professeur_responsable")
    if prof_id and supabase:
        try:
            prof_result = supabase.table("professeurs").select("name").eq("id", prof_id).execute()
            if prof_result.data:
                professeur_nom = prof_result.data[0].get("name")
        except Exception:
            pass
    return SchoolClassRead(
        id=row["id"],
        school_id=row["school_id"],
        nom_classe=row["nom_classe"],
        professeur_responsable=str(prof_id) if prof_id else None,
        professeur_nom=professeur_nom,
        created_at=row.get("created_at"),
    )


# ==================== COURSES ====================

def create_course(school_id: str, data: SchoolCourseCreate) -> SchoolCourseRead:
    supabase = get_supabase_client()
    payload = {
        "school_id": school_id,
        "nom_cours": data.nom_cours,
    }
    if data.libelle:
        payload["libelle"] = data.libelle

    result = supabase.table("school_courses").insert(payload).execute()
    if not result.data:
        raise ValueError("Erreur lors de la création du cours")
    row = result.data[0]
    return SchoolCourseRead(
        id=row["id"],
        school_id=row["school_id"],
        nom_cours=row["nom_cours"],
        libelle=row.get("libelle"),
        created_at=row.get("created_at"),
    )


def get_courses_by_school(school_id: str) -> list[SchoolCourseRead]:
    supabase = get_supabase_client()
    result = supabase.table("school_courses") \
        .select("*") \
        .eq("school_id", school_id) \
        .order("created_at") \
        .execute()
    return [
        SchoolCourseRead(
            id=row["id"],
            school_id=row["school_id"],
            nom_cours=row["nom_cours"],
            libelle=row.get("libelle"),
            created_at=row.get("created_at"),
        )
        for row in result.data
    ]


def update_course(course_id: str, school_id: str, data: SchoolCourseCreate) -> Optional[SchoolCourseRead]:
    supabase = get_supabase_client()
    payload = {"nom_cours": data.nom_cours}
    if data.libelle is not None:
        payload["libelle"] = data.libelle

    result = supabase.table("school_courses").update(payload) \
        .eq("id", course_id).eq("school_id", school_id).execute()
    if not result.data:
        return None
    row = result.data[0]
    return SchoolCourseRead(
        id=row["id"],
        school_id=row["school_id"],
        nom_cours=row["nom_cours"],
        libelle=row.get("libelle"),
        created_at=row.get("created_at"),
    )


def delete_course(course_id: str, school_id: str) -> bool:
    supabase = get_supabase_client()
    result = supabase.table("school_courses").delete() \
        .eq("id", course_id).eq("school_id", school_id).execute()
    return bool(result.data)
