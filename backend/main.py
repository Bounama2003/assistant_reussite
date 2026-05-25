import logging
import os
import time
from contextlib import asynccontextmanager

from urllib.parse import urlparse

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import sentry_sdk

from config.settings import settings
from config.database import get_supabase_client
from utils.rate_limit import limiter
from routes.chat import router as chat_router
from routes.leads import router as leads_router
from routes.schools import router as schools_router
from routes.upload import router as upload_router
from routes.admin_schools import router as admin_router
from routes.students import router as students_router
from routes.chat_sessions import router as chat_sessions_router
from routes.stats import router as stats_router
from routes.exports import router as exports_router
from routes.documents import router as documents_router
from routes.professor import router as professor_router, router_admin as professor_admin_router
from routes.upload import router_prof as professor_upload_router
from routes.quiz import router as quiz_router
from routes.school_config import router as school_config_router
from routes.notifications import router as notifications_router

logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        traces_sample_rate=0.1,
        profiles_sample_rate=0.0,
    )
    logger.info("Sentry monitoring initialized.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Assistant Réussite backend starting...")
    yield
    logger.info("Backend shutting down.")


app = FastAPI(
    title="Assistant Réussite API",
    description="API RAG multi-écoles pour le tutorat IA",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_origin_regex=r"https://.*\.hf\.space",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def csrf_middleware(request: Request, call_next):
    """Check Origin header on state-changing requests as CSRF protection."""
    if request.method in ("POST", "PUT", "DELETE", "PATCH"):
        origin = request.headers.get("origin")
        if origin:
            allowed = [o.strip() for o in settings.allowed_origins.split(",")]
            try:
                parsed = urlparse(origin)
                origin_netloc = parsed.hostname or ""
                if parsed.port:
                    origin_netloc = f"{origin_netloc}:{parsed.port}"
            except Exception:
                origin_netloc = origin
            is_allowed = False
            for a in allowed:
                try:
                    a_parsed = urlparse(a)
                    a_netloc = a_parsed.hostname or ""
                    if a_parsed.port:
                        a_netloc = f"{a_netloc}:{a_parsed.port}"
                except Exception:
                    a_netloc = a
                if origin_netloc == a_netloc:
                    is_allowed = True
                    break
            if not is_allowed and not any(domain in origin_netloc for domain in ["localhost", "127.0.0.1", "0.0.0.0"]) and not origin_netloc.endswith(".hf.space"):
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Origine non autorisée"},
                )
    response = await call_next(request)
    return response


@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    logger.info(f"API Request: {request.method} {request.url.path} - Status: {response.status_code} - {duration:.3f}s")
    return response


@app.get("/")
async def root():
    return {
        "message": "Assistant Réussite API is running",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
async def health(request: Request):
    return {"status": "ok", "service": "Assistant Réussite API"}


@app.get("/health/ready")
async def health_ready(request: Request):
    checks = {}
    all_healthy = True
    
    try:
        supabase = get_supabase_client()
        result = supabase.table("schools").select("id").limit(1).execute()
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = f"error: {str(e)}"
        all_healthy = False
    
    try:
        from rag.engine import embed_model
        checks["embeddings"] = "ok"
    except Exception as e:
        checks["embeddings"] = f"error: {str(e)}"
        all_healthy = False
    
    try:
        from rag.engine import llm
        checks["llm"] = "ok"
    except Exception as e:
        checks["llm"] = f"error: {str(e)}"
        all_healthy = False
    
    status_code = 200 if all_healthy else 503
    return JSONResponse(
        status_code=status_code,
        content={"status": "healthy" if all_healthy else "unhealthy", "checks": checks},
    )

app.include_router(chat_router)
app.include_router(leads_router)
app.include_router(schools_router)
app.include_router(upload_router)
app.include_router(admin_router)
app.include_router(students_router)
app.include_router(chat_sessions_router)
app.include_router(stats_router)
app.include_router(exports_router)
app.include_router(documents_router)
app.include_router(professor_router)
app.include_router(professor_admin_router)
app.include_router(professor_upload_router)
app.include_router(quiz_router)
app.include_router(school_config_router)
app.include_router(notifications_router)

# --- Static frontend (SPA) — for single-container deployments (e.g. Hugging Face) ---
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
FRONTEND_DIR = os.path.normpath(FRONTEND_DIR)

if os.path.isdir(FRONTEND_DIR):
    logger.info("Serving static frontend from %s", FRONTEND_DIR)
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="frontend_assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
else:
    logger.info("No frontend/dist found — API-only mode")