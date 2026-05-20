from config.database import get_supabase_client
import logging

logger = logging.getLogger(__name__)

def get_documents_by_school(school_id: str) -> list[dict]:
    supabase = get_supabase_client()
    # We use a raw RPC or just fetch all and group them in Python if RPC is not available.
    # Grouping by filename, matiere, classe, professeur, annee_scolaire.
    result = supabase.table("documents").select("metadata").execute()
    
    docs_map = {}
    for row in result.data:
        meta = row.get("metadata", {})
        if meta.get("school_id") != school_id:
            continue
            
        key = (meta.get("filename"), meta.get("matiere"), meta.get("classe"), meta.get("professeur"), meta.get("annee_scolaire"))
        if key not in docs_map:
            docs_map[key] = {
                "filename": meta.get("filename"),
                "matiere": meta.get("matiere"),
                "classe": meta.get("classe"),
                "professeur": meta.get("professeur"),
                "annee_scolaire": meta.get("annee_scolaire"),
                "chunk_count": 0
            }
        docs_map[key]["chunk_count"] += 1
        
    return list(docs_map.values())

def delete_document(school_id: str, filename: str, matiere: str | None = None) -> bool:
    supabase = get_supabase_client()
    query = supabase.table("documents").delete().eq("metadata->>school_id", school_id).eq("metadata->>filename", filename)
    if matiere:
        query = query.eq("metadata->>matiere", matiere)
        
    result = query.execute()
    return True # PostgREST delete doesn't always return the count easily in this wrapper
