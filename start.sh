#!/bin/bash
cd /app

VITE_API_URL="${VITE_API_URL:-}"

if [ -n "$VITE_API_URL" ]; then
    echo "=== VITE_API_URL is set — starting UI-only mode (pointing to $VITE_API_URL) ==="
    exec python3 /app/backend/serve_ui.py
fi

echo "=== Checking backend configuration ==="
if python3 -c "
import sys
sys.path.insert(0, '/app/backend')
try:
    from config.settings import settings
    d = settings.model_dump()
    missing = [k for k, v in d.items() if v is None or v == '']
    if missing:
        sys.exit(1)
    print('OK')
except Exception:
    sys.exit(1)
"; then
    echo "=== Starting full backend (API + frontend) ==="
    exec uvicorn backend.main:app --host 0.0.0.0 --port "${PORT:-7860}"
else
    echo "=== Starting UI-only mode (static frontend) ==="
    exec python3 /app/backend/serve_ui.py
fi
