import logging
from fastapi import APIRouter, HTTPException, Header, Query
from typing import Optional

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["Documents"])


@router.get("")
async def list_documents(
    school_id: str = Query(...),
    x_admin_key: str | None = Header(None, alias="X-Admin-Key")
):
    """List documents for a school"""
    from services.school_service import get_school_admin
    from config.database import get_supabase_client
    
    if not x_admin_key:
        raise HTTPException(status_code=403, detail="Cle admin requise")
    school = get_school_admin(school_id)
    if not school:
        raise HTTPException(status_code=404, detail="Ecole introuvable")
    if school.admin_key != x_admin_key:
        raise HTTPException(status_code=403, detail="Cle admin invalide")
    
    supabase = get_supabase_client()

    # LlamaIndex creates 'data_documents' table with 'metadata_' column (underscore suffix).
    # The project's 'documents' table uses 'metadata' (no underscore) but stays empty.
    try:
        result = supabase.table("data_documents").select("id, metadata_").execute()
        documents = {}

        for row in result.data:
            metadata = row.get("metadata_", {})
            if metadata.get("school_id") == school_id:
                filename = metadata.get("filename", "document")
                if filename not in documents:
                    documents[filename] = {
                        "filename": filename,
                        "matiere": metadata.get("matiere", ""),
                        "classe": metadata.get("classe", ""),
                        "professeur": metadata.get("professeur", ""),
                        "annee_scolaire": metadata.get("annee_scolaire", ""),
                        "public": metadata.get("public", True),
                        "chunks": 0
                    }
                documents[filename]["chunks"] += 1

        return list(documents.values())

    except Exception as e:
        logger.error(f"List documents error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")


@router.delete("")
async def delete_document(
    school_id: str = Query(...),
    filename: str = Query(...),
    x_admin_key: str | None = Header(None, alias="X-Admin-Key")
):
    """Delete all chunks of a document by filename"""
    from services.school_service import get_school_admin
    from config.database import get_supabase_client
    
    if not x_admin_key:
        raise HTTPException(status_code=403, detail="Cle admin requise")
    school = get_school_admin(school_id)
    if not school:
        raise HTTPException(status_code=404, detail="Ecole introuvable")
    if school.admin_key != x_admin_key:
        raise HTTPException(status_code=403, detail="Cle admin invalide")
    
    supabase = get_supabase_client()

    try:
        result = supabase.table("data_documents").select("id, metadata_").execute()
        ids_to_delete = []

        for row in result.data:
            metadata = row.get("metadata_", {})
            if metadata.get("school_id") == school_id and metadata.get("filename") == filename:
                ids_to_delete.append(row["id"])

        if not ids_to_delete:
            raise HTTPException(status_code=404, detail="Document introuvable")

        for doc_id in ids_to_delete:
            supabase.table("data_documents").delete().eq("id", doc_id).execute()

        return {"message": f"Document '{filename}' supprime ({len(ids_to_delete)} chunks)"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete document error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")


@router.put("/metadata")
async def update_document_metadata(
    school_id: str = Query(...),
    filename: str = Query(...),
    matiere: Optional[str] = Query(None),
    classe: Optional[str] = Query(None),
    professeur: Optional[str] = Query(None),
    x_admin_key: str | None = Header(None, alias="X-Admin-Key")
):
    """Update metadata for all chunks of a document"""
    from services.school_service import get_school_admin
    from config.database import get_supabase_client
    
    if not x_admin_key:
        raise HTTPException(status_code=403, detail="Cle admin requise")
    school = get_school_admin(school_id)
    if not school:
        raise HTTPException(status_code=404, detail="Ecole introuvable")
    if school.admin_key != x_admin_key:
        raise HTTPException(status_code=403, detail="Cle admin invalide")
    
    supabase = get_supabase_client()
    
    try:
        # Query data_documents (LlamaIndex table) using metadata_ column
        result = supabase.table("data_documents").select("id, metadata_").execute()
        ids_to_update = []
        
        for row in result.data:
            metadata = row.get("metadata_", {})
            if metadata.get("school_id") == school_id and metadata.get("filename") == filename:
                ids_to_update.append(row["id"])
        
        if not ids_to_update:
            raise HTTPException(status_code=404, detail="Document introuvable")
        
        updated = 0
        for doc_id in ids_to_update:
            result = supabase.table("data_documents").select("metadata_").eq("id", doc_id).execute()
            if result.data:
                metadata = result.data[0].get("metadata_", {})
                if matiere is not None:
                    metadata["matiere"] = matiere
                if classe is not None:
                    metadata["classe"] = classe
                if professeur is not None:
                    metadata["professeur"] = professeur
                
                supabase.table("data_documents").update({"metadata_": metadata}).eq("id", doc_id).execute()
                updated += 1
        
        return {"message": f"Metadata mise a jour pour {updated} chunks"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update metadata error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")
