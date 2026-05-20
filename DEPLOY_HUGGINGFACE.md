# Guide de Déploiement Hugging Face (2 Spaces, 2 Environments)

Backend API (Docker) + Frontend React (Static Space — servi via CDN).

**Pourquoi 2 Spaces ?**
- Le Static Space HF sert les fichiers via **CDN mondial** (rapide, pas de latence)
- Le backend utilise toute sa RAM pour les vrais traitements (RAG, LLM)
- Les builds sont **indépendants** : changer le frontend ne redéploie pas le backend
- Le Static Space est **gratuit**

---

## Architecture

```
Utilisateur
├── https://<user>-assistant-reussite-ui.hf.space   (Static Space, CDN)
│     index.html, assets/*.js, sw.js
│     ↓  (appels API avec VITE_API_URL)
└── https://<user>-assistant-reussite-api.hf.space  (Docker Space)
      FastAPI → Supabase / Groq / LlamaIndex
```

---

## Workflow Branches

```
main ────────► assistant-reussite-api (prod) + assistant-reussite-ui (prod)
                ↳ Supabase PROJET_PROD

dev  ────────► assistant-reussite-api-dev (staging) + assistant-reussite-ui-dev (staging)
                ↳ Supabase PROJET_DEV
```

- **`main`** = production stable. Ne mergez que ce qui est testé.
- **`dev`** = développement et tests. Vous pouvez casser des choses.
- Chaque branche a **ses propres Spaces HF** et **son propre projet Supabase**.
- Les builds sont indépendants : un push sur `dev` ne touche pas la prod.

### Créer la branche dev

```bash
# Depuis main (après avoir commit)
git checkout -b dev
git push origin dev
```

---

## Prérequis

- Compte Hugging Face
- **Deux** projets Supabase avec PGVector activé (PROD + DEV)
- Clé API Groq (<https://console.groq.com>)
- Clés VAPID (<https://web-push-codelab.glitch.me/>)

---

## Créer les deux projets Supabase

### Production

1. Allez sur <https://supabase.com> → **New project**
2. Nom : `assistant-reussite-prod`
3. Notez l'URL et la clé **service_role** (Settings > API)
4. Activez l'extension **vector** (Database > Extensions)
5. Exécutez les migrations dans l'ordre (voir README.md)

### Dev / Staging

1. **New project** → Nom : `assistant-reussite-dev`
2. Notez l'URL et la clé **service_role**
3. Activez l'extension **vector**
4. Exécutez les **mêmes migrations** que la prod

```bash
# Automatiser les migrations dev :
./scripts/setup_dev_db.sh
```

---

## Space 1 : Backend API (Production)

### Créer le Space

1. **Hugging Face** → [New Space](https://huggingface.co/new-space)
2. Config :
   - **Nom** : `assistant-reussite-api`
   - **SDK** : Docker
   - **Template** : Blank
3. **Créer**

### Pousser le code

```bash
git remote add hf-api https://huggingface.co/spaces/<USER>/assistant-reussite-api
git push hf-api main
```

### Configurer le Dockerfile

Dans **Settings** > **Dockerfile path** : `Dockerfile.backend`

### Configurer les Secrets

Dans **Settings** > **Repository Secrets** — ajouter **toutes** ces variables :

| Secret | Description |
|--------|-------------|
| `SUPABASE_URL` | URL Supabase |
| `SUPABASE_SERVICE_KEY` | Clé service role |
| `DATABASE_URL` | URL brute `postgresql://` |
| `GROQ_API_KEY` | Clé Groq |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` |
| `VAPID_PUBLIC_KEY` | Clé publique VAPID |
| `VAPID_PRIVATE_KEY` | Clé privée VAPID |
| `SUPER_ADMIN_KEY` | Clé super admin (changez-la !) |
| `ALLOWED_ORIGINS` | `*` |
| `LOG_LEVEL` | `INFO` |
| `LEGACY_HASH_FOR_TESTS` | `False` |

L'application **ne démarre pas** si un secret manque (Pydantic `ValidationError`).

### Obtenir l'URL directe

Une fois le build terminé, Settings > **Embed this Space** > **Direct URL** :
```
https://<USER>-assistant-reussite-api.hf.space
```

### Vérifier

```bash
curl https://<USER>-assistant-reussite-api.hf.space/health
# → {"status":"ok","service":"Assistant Réussite API"}
```

---

## Ajouter le Space API Dev

Répétez les mêmes étapes avec :

| Élément | Production | Dev/Staging |
|---------|-----------|-------------|
| Space API | `assistant-reussite-api` | `assistant-reussite-api-dev` |
| Branche | `main` | `dev` |
| Dockerfile | `Dockerfile.backend` | `Dockerfile.backend` |
| Secrets | `env.prod.example` | `env.dev.example` |

```bash
git remote add hf-api-dev https://huggingface.co/spaces/<USER>/assistant-reussite-api-dev
git push hf-api-dev dev:main  # pousse la branche dev sur main du Space
```

---

## Space 2 : Frontend (Production)

### Créer le Space

1. **Hugging Face** → [New Space](https://huggingface.co/new-space)
2. Config :
   - **Nom** : `assistant-reussite-ui`
   - **SDK** : **Static**
3. **Créer**

### Pousser le code

```bash
git remote add hf-ui https://huggingface.co/spaces/<USER>/assistant-reussite-ui
git push hf-ui main
```

### Configurer le build

Dans **Settings** :

| Champ | Valeur |
|-------|--------|
| **Build Command** | `cd frontend && npm install && npm run build` |
| **Publish Directory** | `frontend/dist` |

### Configurer la variable de build

Dans **Settings** > **Repository Variables** :

| Variable | Valeur |
|----------|--------|
| `VITE_API_URL` | `https://<USER>-assistant-reussite-api.hf.space` |

Vite injecte `VITE_API_URL` au moment du build. Le `api.ts` l'utilise comme `baseURL` pour axios.
Si elle est vide (dev), les requêtes passent par le proxy Vite vers `localhost:8000`.

### Vérifier

Le Space se build automatiquement. Une fois terminé :
```
https://<USER>-assistant-reussite-ui.hf.space
```

Ouvrez dans le navigateur. Tout doit fonctionner (login, chat, quiz, admin).

## Ajouter le Space Frontend Dev

| Élément | Production | Dev/Staging |
|---------|-----------|-------------|
| Space UI | `assistant-reussite-ui` | `assistant-reussite-ui-dev` |
| Branche | `main` | `dev` |
| SDK | Static | Static |
| Build command | `cd frontend && npm install && npm run build` | identique |
| Publish dir | `frontend/dist` | identique |
| Variable `VITE_API_URL` | `https://<USER>-assistant-reussite-api.hf.space` | `https://<USER>-assistant-reussite-api-dev.hf.space` |

```bash
git remote add hf-ui-dev https://huggingface.co/spaces/<USER>/assistant-reussite-ui-dev
git push hf-ui-dev dev:main
```

---

## Workflow quotidien

```bash
# 1. Travailler sur dev
git checkout dev
# ... modifier du code ...
git add .
git commit -m "feat: ajout nouvelle feature"
git push origin dev

# 2. Déployer sur les Spaces dev
git push hf-api-dev dev:main
git push hf-ui-dev dev:main

# 3. Tester sur https://user-assistant-reussite-ui-dev.hf.space

# 4. Merge vers main (production)
git checkout main
git merge dev
git push origin main

# 5. Déployer en production
git push hf-api main
git push hf-ui main
```

Chaque Space rebuild **indépendamment**. Un composant CSS changé dans `dev` ne redéploie pas la prod.

---

## Alternative mono-Space (prototype / démo)

Pour une démo rapide, un seul Space Docker sert backend + frontend ensemble :

```bash
# Dans Settings > Dockerfile path : Dockerfile.huggingface
```

**Avantage** : 1 push, pas de CORS.
**Inconvénient** : pas de CDN, les fichiers statiques sont servis par le process Python.

---

## Notes importantes

- **Port 7860** : Port standard HF. `Dockerfile.backend` et `Dockerfile.huggingface` l'utilisent.
- **Migrations** : Appliquez les SQL sur Supabase **avant** de déployer.
- **Build time** : ~5-10 min le premier coup (cache Docker + npm). Les suivants sont rapides.
- **ALLOWED_ORIGINS = `*`** : Acceptable pour un Space HF. Ne faites pas ça sur un serveur dédié.

---

*Dernière mise à jour: 2026-05-18*
