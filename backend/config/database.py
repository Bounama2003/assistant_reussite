from supabase import create_client, Client
from config.settings import settings
from functools import lru_cache


@lru_cache()
def get_supabase_client() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_key)
