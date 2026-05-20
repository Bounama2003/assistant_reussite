import logging
import os
import tempfile
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Header, Request
from main import limiter

from models.schemas import UploadResponse, ErrorResponse
from rag.engine import ingest_pdf
from services.school_service import get_school_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/upload", tags=["Upload"])
router_prof = APIRouter(prefix="/professor", tags=["Professeur Upload"])

MAX_UPLOAD_SIZE = 20 * 1024 * 1024  # 20 MB
PDF_MAGIC_BYTES = b"%PDF"


def _validate_pdf(file: UploadFile, contents: bytes) -> None:
    """Validate file size and MIME type (magic bytes)."""
    if len(contents) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Le fichier dépasse la limite de {MAX_UPLOAD_SIZE // (1024 * 1024)} Mo",
        )
    if not contents.startswith(PDF_MAGIC_BYTES):
        raise HTTPException(
            status_code=400,
            detail="Le fichier n'est pas un PDF valide (magic bytes invalides)",
        )
    filename = file.filename or ""
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Seuls les fichiers PDF sont acceptés",
        )


@router.post("", response_model=UploadResponse, responses={400: {"model": ErrorResponse}, 403: {"model": ErrorResponse}, 413: {"description": "File too large"}})
@limiter.limit("10/minute")
async def upload_pdf(
    request: Request,
    file: UploadFile = File(...),
    school_id: str = Form(...),
    matiere: str = Form(None),
    classe: str = Form(None),
    professeur: str = Form(None),
    public: bool = Form(True),
    x_admin_key: str | None = Header(None, alias="X-Admin-Key"),
):
    if not x_admin_key:
        raise HTTPException(status_code=403, detail="Clé admin requise pour uploader des documents")

    school = get_school_admin(school_id)
    if not school:
        raise HTTPException(status_code=404, detail=f"École '{school_id}' introuvable")
    if school.admin_key != x_admin_key:
        raise HTTPException(status_code=403, detail="Clé admin invalide")
    if school.is_suspended:
        raise HTTPException(status_code=403, detail="École suspendue")

    contents = await file.read()
    _validate_pdf(file, contents)
    filename = file.filename or ""

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        chunks = ingest_pdf(tmp_path, school_id, matiere, classe, professeur, school.annee_scolaire_active, public)
        # ── Push notification to relevant professors ──
        try:
            from services.push_service import send_to_school_role
            send_to_school_role(
                role="professor",
                school_id=school_id,
                title="Nouveau document disponible",
                body=f"Un document a été uploadé ({filename})",
                data={"url": "/professor/documents", "type": "document_upload"},
            )
        except Exception:
            logger.warning("Push notification failed for upload")
        return UploadResponse(
            filename=filename,
            chunks_ingested=chunks,
            school_id=school_id,
        )
    except Exception as e:
        logger.error(f"Upload error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erreur d'ingestion: {str(e)}")
    finally:
        os.unlink(tmp_path)


@router_prof.post("/upload", response_model=UploadResponse, responses={400: {"model": ErrorResponse}, 403: {"model": ErrorResponse}, 413: {"description": "File too large"}})
@limiter.limit("10/minute")
async def professor_upload_pdf(
    request: Request,
    file: UploadFile = File(...),
    matiere: str = Form(...),
    classe: str = Form(...),
    public: bool = Form(True),
    x_professor_key: str = Header(..., alias="X-Professor-Key"),
):
    parts = x_professor_key.split("-")
    if len(parts) < 3:
        raise HTTPException(status_code=403, detail="Clé professeur invalide")
    school_id = parts[1]

    from services.school_service import get_school_admin
    school = get_school_admin(school_id)
    if not school:
        raise HTTPException(status_code=404, detail="École introuvable")

    from services import professor_service
    proffs = professor_service.get_professors_by_school(school_id)
    prof = None
    for p in proffs:
        if p.professor_key == x_professor_key:
            prof = p
            break
    if not prof:
        raise HTTPException(status_code=403, detail="Professeur non trouvé")

    if matiere not in (prof.matieres or []):
        raise HTTPException(status_code=403, detail="Matière non autorisée pour ce professeur")

    # Parse comma-separated classes into a list, validate each individually
    classes = [c.strip() for c in classe.split(",") if c.strip()]
    if not classes:
        raise HTTPException(status_code=422, detail="Au moins une classe doit être spécifiée")
    for c in classes:
        if c not in (prof.classes or []):
            raise HTTPException(status_code=403, detail=f"Classe '{c}' non autorisée pour ce professeur")

    contents = await file.read()
    _validate_pdf(file, contents)
    filename = file.filename or ""

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        # Loop over each class: ingest_pdf once per class so metadata is correct
        total_chunks = 0
        for c in classes:
            total_chunks += ingest_pdf(tmp_path, school_id, matiere, c, prof.name, school.annee_scolaire_active, public)

        # ── Push notification to other professors in the same school ──
        try:
            from services.push_service import send_to_school_role
            send_to_school_role(
                role="professor",
                school_id=school_id,
                title="Nouveau document disponible",
                body=f"{prof.name} a uploadé un document ({filename})",
                data={"url": "/professor/documents", "type": "document_upload"},
            )
        except Exception:
            logger.warning("Push notification failed for professor upload")
        return UploadResponse(
            filename=filename,
            chunks_ingested=total_chunks,
            school_id=school_id,
        )
    except Exception as e:
        logger.error(f"Professor upload error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erreur d'ingestion: {str(e)}")
    finally:
        os.unlink(tmp_path)


@router_prof.delete("/documents/{filename}")
@limiter.limit("20/minute")
async def professor_delete_document(
    request: Request,
    filename: str,
    x_professor_key: str = Header(..., alias="X-Professor-Key"),
):
    parts = x_professor_key.split("-")
    if len(parts) < 3:
        raise HTTPException(status_code=403, detail="Clé professeur invalide")
    school_id = parts[1]

    from services import professor_service
    from config.database import get_supabase_client
    proffs = professor_service.get_professors_by_school(school_id)
    prof = None
    for p in proffs:
        if p.professor_key == x_professor_key:
            prof = p
            break
    if not prof:
        raise HTTPException(status_code=403, detail="Professeur non trouvé")

    supabase = get_supabase_client()
    doc_result = supabase.table("data_documents").select("id, metadata_").execute()
    ids_to_delete = []
    for row in doc_result.data:
        meta = row.get("metadata_", {})
        if meta.get("school_id") != school_id:
            continue
        if meta.get("filename") != filename:
            continue
        doc_prof = meta.get("professeur", "")
        doc_matiere = meta.get("matiere", "")
        doc_classe = meta.get("classe", "")
        if doc_prof == prof.name or (doc_matiere in (prof.matieres or []) and doc_classe in (prof.classes or [])):
            ids_to_delete.append(row["id"])

    if not ids_to_delete:
        raise HTTPException(status_code=404, detail="Document introuvable")

    for doc_id in ids_to_delete:
        supabase.table("data_documents").delete().eq("id", doc_id).execute()

    return {"message": f"Document '{filename}' supprimé ({len(ids_to_delete)} chunks)"}
