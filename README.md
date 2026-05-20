---
title: Assistant Réussite
emoji: 🎓
colorFrom: indigo
colorTo: green
sdk: docker
pinned: false
---

# Assistant Réussite — Plateforme de Tutorat IA Multi-Tenant

Assistant Réussite est une application SaaS éducative multi-tenant avec IA (RAG) pour le tutorat scolaire.

---

## Architecture

| Couche | Technologie |
|--------|-------------|
| Backend | FastAPI + Uvicorn |
| Base de données | Supabase (PostgreSQL + PGVector 384d) |
| LLM | Groq (`llama-3.3-70b-versatile`) |
| Embeddings | BAAI/bge-small-en-v1.5 (384 dims) |
| Frontend | React 19 + TypeScript + Vite 8 |
| Styling | TailwindCSS v4 (`@theme` directive) |
| PWA | `vite-plugin-pwa` (injectManifest) |

---

## Prérequis

- Python 3.12+
- Node.js 20+
- Projet Supabase avec extension **PGVector** activée
- Clé API Groq (<https://console.groq.com>)
- (Optionnel) Clés VAPID pour les notifications push (<https://web-push-codelab.glitch.me/>)

---

## Configuration

### 1. Cloner le projet

```bash
git clone <repo-url>
cd school-rag
```

### 2. Environnement virtuel + dépendances Backend

```bash
python3 -m venv .venv
source .venv/bin/activate          # Linux/Mac
pip install -r requirements.txt
```

### 3. Dépendances Frontend

```bash
cd frontend
npm install
cd ..
```

### 4. Variables d'environnement

```bash
cp .env.example .env
# Puis éditer .env avec vos vraies valeurs
```

**Toutes les variables marquées REQUISES dans `.env.example` doivent être renseignées.**  
Si une variable est absente, l'API refusera de démarrer (Pydantic `ValidationError`).

### 5. Base de données Supabase

1. Créer un projet sur <https://supabase.com>
2. Activer l'extension **vector** : Database → Extensions
3. **SQL Editor** → exécuter **dans l'ordre** :
   - `supabase/clean_migration.sql` *(obligatoire — drop + recreate)*
   - `supabase/migration_add_school_fields.sql`
   - `supabase/migration_professeurs.sql`
   - `supabase/migration_quiz_tables.sql`
   - `supabase/migration_reactions.sql`
   - `supabase/migration_superadmin.sql`
   - `supabase/migration_fk_notifications_user_id.sql`
   - `supabase/migration_index_is_suspended.sql`

> ⚠️ **Ne pas exécuter `supabase/schema.sql`** — il utilise 1536 dimensions (au lieu de 384) et corrompt la base.

---

## Lancer l'Application

### Terminal 1 — Backend

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Vérifications :

```bash
curl http://localhost:8000/health          # → {"status":"ok"}
curl http://localhost:8000/health/ready    # → {"status":"healthy","checks":{...}}
```

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

Accès : **http://localhost:5173**

---

## Routes API principales

| Méthode | Path | Auth |
|---------|------|------|
| POST | `/chat` | `X-Student-Id` (opt) |
| POST | `/quiz` | `X-Student-Id` |
| POST | `/quiz/{id}/answer` | `X-Student-Id` |
| POST | `/professor/login` | — |
| POST | `/upload` | `X-Professor-Key` |
| GET | `/admin/schools` | `X-Super-Admin-Key` |
| GET | `/stats/{school_id}` | `X-Admin-Key` |

---

## Tests

### Backend (90+ tests)

```bash
python -m pytest backend/tests/ -v
```

- `test_api.py` — 25 tests endpoints
- `test_uploads.py` — 8 tests upload sécurisé
- `test_notifications.py` — 10 tests notifications push
- `test_lead_service.py`, `test_schemas.py`, `test_student_service.py`, `test_rag_engine.py`

### Frontend

```bash
cd frontend && npm test
```

- Tests Vitest + @testing-library/react
- `ErrorBoundary.test.tsx`, `authStore.test.tsx`, `AppLayout.test.tsx`

---

## Variables d'Environnement

| Variable | Requise | Description |
|----------|---------|-------------|
| `SUPABASE_URL` | ✅ | URL du projet Supabase |
| `SUPABASE_SERVICE_KEY` | ✅ | Clé service role |
| `DATABASE_URL` | ✅ | URL brute `postgresql://` (⚠️ pas asyncpg) |
| `GROQ_API_KEY` | ✅ | Clé API Groq |
| `GROQ_MODEL` | ❌ | Défaut : `llama-3.3-70b-versatile` |
| `VAPID_PUBLIC_KEY` | ✅ | Notification push — générer sur web-push-codelab |
| `VAPID_PRIVATE_KEY` | ✅ | Notification push |
| `SUPER_ADMIN_KEY` | ✅ | Clé super-admin — **à changer impérativement** |
| `ALLOWED_ORIGINS` | ❌ | Défaut : `http://localhost:5173,http://localhost:8000` |
| `LOG_LEVEL` | ❌ | Défaut : `INFO` |
| `SENTRY_DSN` | ❌ | Pour le monitoring d'erreurs |
| `LEGACY_HASH_FOR_TESTS` | ❌ | `True` pour compat tests SHA-256, `False` pour bcrypt en prod |

---

## Sécurité

- **Mots de passe** : bcrypt en production (SHA-256 en mode test)
- **Multi-tenant** : isolation stricte par `school_id` + `annee_scolaire` via `MetadataFilter`
- **Rate limiting** : 30 req/min sur `/chat`, 20 req/min sur `/quiz`, 10 req/min sur `/upload`
- **CSRF** : middleware activé sur toutes les routes mutables
- **Auth** : double système `AuthContext` + Zustand `authStore` avec `sessionStorage`
- **Validation** : Pydantic v2 + Zod côté frontend
- **Secrets** : aucune valeur par défaut faible tolérée en production ; l'application refuse de démarrer

---

## Docker

```bash
# Backend uniquement
docker-compose up --build
```

- `Dockerfile` : multi-stage (builder → runner), image légère ~200 Mo
- `docker-compose.yml` : backend port 8000 + frontend port 5173

---

## Déploiement

Voir `DEPLOY_HUGGINGFACE.md` pour le déploiement sur Hugging Face Spaces.

---

*Dernière mise à jour: 2026-05-18*
