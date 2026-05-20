#!/usr/bin/env bash
set -euo pipefail

# ========================================
# Assistant Réussite — DB Backup Script
# ========================================
# Usage:
#   ./scripts/backup.sh                    # dump to ./backups/
#   ./scripts/backup.sh /path/to/dumpdir   # custom output dir
#
# Requires:
#   - pg_dump (PostgreSQL client)
#   - DATABASE_URL in .env (root dir) or set as env var
# ========================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$PROJECT_DIR/.env"
  set +a
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set."
  echo "Set it in .env or export DATABASE_URL before running."
  exit 1
fi

DATABASE_URL="${DATABASE_URL%\"}"
DATABASE_URL="${DATABASE_URL#\"}"
DATABASE_URL="${DATABASE_URL%\'}"
DATABASE_URL="${DATABASE_URL#\'}"

BACKUP_DIR="${1:-$PROJECT_DIR/backups}"
mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
DUMP_FILE="$BACKUP_DIR/assistant_reussite_${TIMESTAMP}.sql.gz"
LATEST_LINK="$BACKUP_DIR/assistant_reussite_latest.sql.gz"

echo "=== DB Backup === "
echo "  Output: $DUMP_FILE"
echo "  URL:    $(echo "$DATABASE_URL" | sed 's|://[^:]*:[^@]*@|://user:pass@|')"
echo ""

pg_dump "$DATABASE_URL" \
  --no-owner \
  --no-acl \
  --compress=6 \
  --file="$DUMP_FILE"

ln -sf "$DUMP_FILE" "$LATEST_LINK"

ORIG_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
echo ""
echo "✅ Backup complete:"
echo "  File:  $DUMP_FILE"
echo "  Size:  $ORIG_SIZE"

find "$BACKUP_DIR" -name 'assistant_reussite_*.sql.gz' -mtime +30 -delete 2>/dev/null || true

echo "  (Backups older than 30 days cleaned up)"
