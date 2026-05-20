from config.database import get_supabase_client
from models.schemas import LeadCreate, LeadRead


def create_lead(lead_data: LeadCreate) -> LeadRead:
    supabase = get_supabase_client()

    existing_lead = supabase.table("leads").select("id").eq("phone", lead_data.phone).eq("school_id", lead_data.school_id).execute()
    if existing_lead.data:
        raise ValueError("Ce numéro de téléphone existe déjà. Veuillez utiliser un autre numéro ou vous connecter.")

    existing_student = supabase.table("students").select("id").eq("phone", lead_data.phone).eq("school_id", lead_data.school_id).execute()
    if existing_student.data:
        raise ValueError("Ce numéro de téléphone appartient déjà à un élève. Veuillez vous connecter directement.")

    try:
        result = supabase.table("leads").insert({
            "student_name": lead_data.student_name,
            "phone": lead_data.phone,
            "serie": lead_data.serie,
            "school_id": lead_data.school_id,
        }).execute()
    except Exception as e:
        error_str = str(e)
        if "23505" in error_str or "duplicate" in error_str.lower():
            raise ValueError("Ce numéro de téléphone existe déjà. Veuillez utiliser un autre numéro ou vous connecter.")
        raise
    row = result.data[0]
    return LeadRead(
        id=row["id"],
        student_name=row["student_name"],
        phone=row["phone"],
        serie=row.get("serie"),
        school_id=row["school_id"],
        created_at=row["created_at"],
    )


def get_leads_by_school(school_id: str) -> list[LeadRead]:
    supabase = get_supabase_client()
    # Only return non-converted leads for the admin list
    result = supabase.table("leads").select("*").eq("school_id", school_id).eq("converted", False).order("created_at", desc=True).execute()
    return [
        LeadRead(
            id=row["id"],
            student_name=row["student_name"],
            phone=row["phone"],
            serie=row.get("serie"),
            school_id=row["school_id"],
            created_at=row["created_at"],
        )
        for row in result.data
    ]


def delete_lead(lead_id: str, school_id: str):
    supabase = get_supabase_client()
    supabase.table("leads").delete().eq("id", lead_id).eq("school_id", school_id).execute()
