#!/bin/bash
cd /app

echo "=== Checking backend configuration ==="
if python3 -c "
import sys
sys.path.insert(0, '/app/backend')
try:
    from config.settings import settings
    d = settings.model_dump()
    missing = [k for k, v in d.items() if v is None or v == '']
    if missing:
        print(f'MISSING: {missing}')
        sys.exit(1)
    print('OK - all variables set')
except Exception as e:
    print(f'FAILED: {e}')
    sys.exit(1)
"; then
    echo "=== Starting full backend (API + frontend) ==="
    exec uvicorn backend.main:app --host 0.0.0.0 --port "${PORT:-7860}"
else
    echo "=== Starting UI-only mode (static frontend) ==="
    exec python3 /app/backend/serve_ui.py
fi
