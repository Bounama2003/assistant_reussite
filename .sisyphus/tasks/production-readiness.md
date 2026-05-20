# Production Readiness — Plan de correction

> Démarré le 2026-05-17, mis en pause. Reprendre ici.

## Contexte

Audit complet de l'application Assistant Réussite (école-rag). Verdict : **pas prête pour la production** — 8 critiques, 6 haute priorité, 7 moyenne.

L'audit détaillé est dans la session de conversation Sisyphus.

## Bloc 1 — 🔴 CRITIQUE (2-3 jours)

### 1.1 Supprimer `schema.sql` ou le corriger
- **Fichier** : `supabase/schema.sql`
- **Action** : Le fichier utilise `vector(1536)` mais le modèle est BGE-small (384d). Soit le supprimer, soit le remplacer par une redirection vers `clean_migration.sql`
- **Vérification** : `grep -n "1536" supabase/schema.sql` ne doit plus rien retourner

### 1.2 Nettoyer `.env.example`
- **Fichier** : `.env.example` ligne 26
- **Action** : Supprimer `sup_pwd=bbounama2100`
- **Vérification** : Plus aucun mot de passe en clair dans le fichier

### 1.3 Ajouter une limite de taille sur les uploads
- **Fichier** : `backend/routes/upload.py` (admin + professor upload)
- **Action** : Configurer `max_size` sur `UploadFile` (ex: 20MB). Ajouter vérification MIME type (magic bytes PDF) en plus de l'extension
- **Vérification** : Un fichier > 20MB reçoit une 413, un fichier `.exe` renommé en `.pdf` est rejeté

### 1.4 Réduire le taux d'échantillonnage Sentry
- **Fichier** : `backend/main.py` lignes 42-43
- **Action** : `traces_sample_rate=0.1`, `profiles_sample_rate=0.0`
- **Vérification** : Surcharge Sentry réduite de 90%

### 1.5 Ajouter protection CSRF / Origin check
- **Fichier** : `backend/main.py`
- **Action** : Middleware ou décorateur qui vérifie le header `Origin` contre `ALLOWED_ORIGINS`

### 1.6 Unifier les deux systèmes d'auth (frontend)
- **Fichiers** : `src/contexts/AuthContext.tsx` + `src/stores/authStore.ts`
- **Action** : Supprimer AuthContext, utiliser uniquement authStore (Zustand persist) dans toute l'app
- **Vérification** : Plus de désync possible, un seul source of truth

### 1.7 Ajouter déconnexion auto sur 401
- **Fichier** : `frontend/src/services/api.ts` (intercepteur response)
- **Action** : Sur 401, appeler `useAuthStore.getState().logout()` + redirect vers login
- **Vérification** : Token expiré → logout auto + page de login

### 1.8 Assouplir la contrainte `check_valid_classe`
- **Fichier** : `supabase/migration_add_school_fields.sql` lignes 44-46
- **Action** : Supprimer la contrainte CHECK, ou la remplacer par une validation plus permissive (ex: NOT NULL uniquement)
- **Vérification** : On peut créer un étudiant avec n'importe quel nom de classe

## Bloc 2 — 🟠 HAUTE PRIORITÉ (3-4 jours)

### 2.1 Rate limiting sur tous les endpoints
- Endpoints cibles : `professor/login`, `professor/login-key`, `admin/*`, `upload`, `quiz/answer`, `/notifications/subscribe`
- **Action** : Ajouter `@limiter.limit()` avec des limites adaptées

### 2.2 Corriger `updated_at = "now()"`
- **Fichiers** : `services/chat_session_service.py:92`, `services/school_service.py:158`
- **Action** : Remplacer `"now()"` par une vraie date ISO (`datetime.utcnow().isoformat()`)
- **Vérification** : `updated_at` en DB contient une vraie date, pas la chaîne "now()"

### 2.3 Optimiser les N+1 queries
- **Fichiers** : `services/professor_service.py`, `services/school_service.py`
- **Action** : Remplacer les boucles Python par des requêtes SQL/Supabase optimisées (COUNT, agrégation)

### 2.4 Ajouter ErrorBoundary React
- **Fichier** : `frontend/src/components/layout/AppLayout.tsx`
- **Action** : Envelopper `<Outlet />` avec un ErrorBoundary global

### 2.5 Dockerfile + docker-compose
- **Action** : Créer Dockerfile (multi-stage, Python 3.12), docker-compose.yml avec backend + dépendances
- **Vérification** : `docker compose up` fonctionne clean

### 2.6 Rendre les clés VAPID obligatoires
- **Fichier** : `backend/config/settings.py`
- **Action** : Enlever les valeurs par défaut, les rendre obligatoires via `.env`
- **Vérification** : L'app refuse de démarrer sans VAPID keys

## Bloc 3 — 🟡 MOYENNE PRIORITÉ (2-3 jours)

### 3.1 Ajouter mypy/pyright
- **Action** : Configurer un type checker Python

### 3.2 Ajouter des tests frontend
- **Action** : Au moins un test de rendu basique par route

### 3.3 Ajouter FK sur `notifications_subscriptions.user_id`
- **Fichier** : Migration SQL

### 3.4 Ajouter index sur `schools.is_suspended`
- **Fichier** : Migration SQL

### 3.5 Nettoyer les dépendances obsolètes
- **Fichier** : `requirements.txt` — supprimer `fpdf2`

### 3.6 Étendre la couverture des tests backend
- Cibles prioritaires : services de notification, push_service, upload

### 3.7 Session-only storage pour auth tokens
- **Option** : `sessionStorage` au lieu de `localStorage` pour certains tokens

## Rappel : fichiers clés de l'audit

| Fichier | Contenu |
|---------|---------|
| `backend/main.py` | App config, Sentry, CORS, middleware |
| `backend/config/settings.py` | VAPID keys, defaults dangereux |
| `backend/routes/upload.py` | Upload sans limite de taille |
| `backend/services/*.py` | N+1 queries, `updated_at` bug |
| `supabase/clean_migration.sql` | ✅ Bon (384d) |
| `supabase/schema.sql` | ❌ Dangereux (1536d) |
| `supabase/migration_add_school_fields.sql` | Contrainte CHECK trop stricte |
| `frontend/src/stores/authStore.ts` | Auth Zustand |
| `frontend/src/contexts/` | AuthContext (à unifier) |
| `frontend/src/services/api.ts` | Intercepteur 401 manquant |
| `frontend/src/components/layout/AppLayout.tsx` | ErrorBoundary manquant |
| `.env.example` | Mot de passe en clair |

## Session info
- Session ID : `ses_1c98445d0ffe9iGu2ZbrA7sCI3`
- Dernier message : "je vais prendre une pause et revenir apres on fera tous les correctifs"
