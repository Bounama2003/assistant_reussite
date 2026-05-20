import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator


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
