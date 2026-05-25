import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator


def _hf_space_allowed_origins() -> list[str]:
    """Auto-detect Hugging Face Spaces and return allowed origin URLs.

    HF Spaces set SPACE_ID (e.g. 'data-rag/assistant-reussite-api-dev').
    From this we derive the Space's own URL and a pattern for the sibling
    Spaces (UI dev/prod) that need CORS access to this API Space.
    """
    space_id = os.environ.get("SPACE_ID", "").strip()
    if not space_id or "/" not in space_id:
        return []
    author, name = space_id.split("/", 1)
    own_url = f"https://{author}-{name}.hf.space"
    origins = [own_url]
    if name.endswith("-api"):
        base = name[:-4]
        origins.append(f"https://{author}-{base}.hf.space")
        origins.append(f"https://{author}-{base}-dev-ui.hf.space")
    elif name.endswith("-api-dev"):
        base = name[:-8]
        origins.append(f"https://{author}-{base}-dev-ui.hf.space")
        origins.append(f"https://{author}-{base}.hf.space")
    return origins


class Settings(BaseSettings):
    supabase_url: str
    supabase_service_key: str
    database_url: str
    groq_api_key: str
    groq_model: str = "llama-3.3-70b-versatile"
    admin_secret_key: str = "CHANGE-ME-admin-secret"  # TODO: remove — currently unused in routes
    legacy_hash_for_tests: bool = True  # Enabled by default for test compatibility; override in production via .env
    super_admin_key: str = "CHANGE-ME-super-admin-secret"
    allowed_origins: str = "http://localhost:5173,http://localhost:8000"
    log_level: str = "INFO"
    sentry_dsn: str | None = None

    # Web Push (VAPID) — must be set in .env (production requirement)
    vapid_public_key: str
    vapid_private_key: str

    @property
    def allowed_origins_list(self) -> list[str]:
        """Return allowed origins as a list, auto-adding Hugging Face Spaces."""
        base = [o.strip() for o in self.allowed_origins.split(",") if o.strip()]
        base.extend(_hf_space_allowed_origins())
        return base

    @field_validator("*", mode="before")
    @classmethod
    def strip_strings(cls, v: any) -> any:
        if isinstance(v, str):
            return v.strip().strip("'").strip('"')
        return v

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent.parent.parent / ".env",
        env_file_encoding="utf-8",
    )


def get_settings() -> Settings:
    return Settings()


settings = Settings()
