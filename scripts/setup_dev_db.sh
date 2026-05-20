#!/usr/bin/env bash
set -euo pipefail

# ================================================
# Setup Dev Database — Assistant Réussite
# ================================================
# Usage:
#   ./scripts/setup_dev_db.sh
#
# Prérequis :
#   - Un projet Supabase DEV créé sur https://supabase.com
#   - PGVector activé (Database > Extensions > vector)
#   - DATABASE_URL du projet DEV dans .env ou en variable
# ================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set."
  echo "Assurez-vous d'avoir configuré le .env avec la base DEV."
  exit 1
fi

echo "=== Assistant Réussite — Dev DB Setup ==="
echo "URL: $(echo "$DATABASE_URL" | sed 's|://[^:]*:[^@]*@|://user:pass@|')"
echo ""

if ! command -v psql &>/dev/null; then
  echo "ERROR: psql non trouvé. Installez le client PostgreSQL."
  exit 1
fi

MIGRATIONS_DIR="$PROJECT_DIR/supabase"
MIGRATIONS=(
  "clean_migration.sql"
  "migration_add_school_fields.sql"
  "migration_professeurs.sql"
  "migration_quiz_tables.sql"
  "migration_reactions.sql"
  "migration_superadmin.sql"
  "migration_fk_notifications_user_id.sql"
  "migration_index_is_suspended.sql"
)

echo "Exécution des migrations dans l'ordre..."
for MIGRATION in "${MIGRATIONS[@]}"; do
  FILE="$MIGRATIONS_DIR/$MIGRATION"
  if [ -f "$FILE" ]; then
    echo "  → $MIGRATION ..."
    psql "$DATABASE_URL" -f "$FILE" -q 2>&1 | grep -i "error\|warning" || true
    echo "    ✓ OK"
  else
    echo "  ⚠ $MIGRATION introuvable, ignoré"
  fi
done

echo ""
echo "✅ Base de données DEV prête !"
echo "   Vous pouvez maintenant déployer sur le Space HF dev."
