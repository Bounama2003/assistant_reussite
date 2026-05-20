# Workflow Dev → Prod

## Architecture

```
                    ┌─────────────────────┐
                    │  Supabase DEV        │
                    │  assistant-reussite  │
                    └───────┬─────────────┘
                            │
┌───────┐    ┌──────────────▼──────────────┐
│  dev  │───►│  assistant-reussite-api-dev  │ (Docker)
│ branche│   │  assistant-reussite-ui-dev   │ (Static, CDN)
└───────┘   └──────────────┬──────────────┘
                           │ tests OK ?
                    ┌──────▼──────┐
                    │   MERGE     │
                    │  dev → main │
                    └──────┬──────┘
                           │
┌───────┐    ┌──────────────▼──────────────┐
│ main  │───►│  assistant-reussite-api      │ (Docker)
│ branche│   │  assistant-reussite-ui       │ (Static, CDN)
└───────┘   └──────────────┬──────────────┘
                           │
                    ┌──────▼──────────────┐
                    │  Supabase PROD       │
                    │  assistant-reussite- │
                    │  prod                │
                    └─────────────────────┘
```

---

## 1. Initialisation unique

### 1.1 Créer les projets Supabase

```bash
# 1. Aller sur https://supabase.com
# 2. Créer PROJET_PROD (ex: assistant-reussite-prod)
# 3. Créer PROJET_DEV (ex: assistant-reussite-dev)
# 4. Activer l'extension PGVector sur les DEUX
# 5. Exécuter les migrations sur les DEUX (voir README.md)
```

### 1.2 Ajouter les remotes HF

```bash
# ---------- PRODUCTION ----------
git remote add hf-api https://huggingface.co/spaces/<USER>/assistant-reussite-api
git remote add hf-ui  https://huggingface.co/spaces/<USER>/assistant-reussite-ui

# ---------- DEV ----------
git remote add hf-api-dev https://huggingface.co/spaces/<USER>/assistant-reussite-api-dev
git remote add hf-ui-dev  https://huggingface.co/spaces/<USER>/assistant-reussite-ui-dev
```

### 1.3 Configurer les Secrets HF

Dans **Settings > Repository Secrets** de CHAQUE Space HF :

| Secret | Prod | Dev |
|--------|------|-----|
| `SUPABASE_URL` | URL PROD | URL DEV |
| `SUPABASE_SERVICE_KEY` | key PROD | key DEV |
| `DATABASE_URL` | url PROD | url DEV |
| `GROQ_API_KEY` | groq PROD (ou même clé) | groq DEV |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | `llama-3.3-70b-versatile` |
| `VAPID_PUBLIC_KEY` | vapid PROD | vapid DEV |
| `VAPID_PRIVATE_KEY` | vapid PROD | vapid DEV |
| `SUPER_ADMIN_KEY` | clé forte PROD | clé forte DEV |
| `ALLOWED_ORIGINS` | `*` (ou URL ui.hf.space) | `*` (ou URL ui-dev.hf.space) |
| `LOG_LEVEL` | `INFO` | `DEBUG` |
| `LEGACY_HASH_FOR_TESTS` | `False` | `False` |

### 1.4 Configurer le Space Frontend DEV

Dans **Settings** du Space `assistant-reussite-ui-dev` :

| Champ | Valeur |
|-------|--------|
| **Build Command** | `cd frontend && npm install && npm run build` |
| **Publish Directory** | `frontend/dist` |
| **Variable** `VITE_API_URL` | `https://<USER>-assistant-reussite-api-dev.hf.space` |

### 1.5 Configurer le Space Frontend PROD

Dans **Settings** du Space `assistant-reussite-ui` :

| Champ | Valeur |
|-------|--------|
| **Build Command** | `cd frontend && npm install && npm run build` |
| **Publish Directory** | `frontend/dist` |
| **Variable** `VITE_API_URL` | `https://<USER>-assistant-reussite-api.hf.space` |

### 1.6 Premier push

```bash
# Pousser main → Spaces PROD
git push hf-api main
git push hf-ui main

# Pousser dev → Spaces DEV
git push hf-api-dev dev:main
git push hf-ui-dev dev:main
```

---

## 2. Cycle de développement quotidien

### 2.1 Travailler sur une feature

```bash
# Se positionner sur dev (toujours)
git checkout dev

# S'assurer d'être à jour
git pull origin dev

# Créer une branche feature (optionnel)
git checkout -b feat/mon-audio

# ... coder, coder, coder ...

# Commiter sur la branche feature
git add .
git commit -m "feat: description de la feature"
```

### 2.2 Tester en local

```bash
# Backend
cd backend
python -m pytest tests/ -v

# Frontend
cd frontend
npm test
npm run build   # Vérifier que le build passe
```

### 2.3 Déployer sur DEV

```bash
# Revenir sur dev
git checkout dev
git merge feat/mon-audio

# Pousser sur GitHub (sauvegarde)
git push origin dev

# Déployer sur les Spaces DEV
git push hf-api-dev dev:main
git push hf-ui-dev dev:main
```

⏳ Attendre le build HF (2-5 min).  
🔗 Tester sur `https://<USER>-assistant-reussite-ui-dev.hf.space`

### 2.4 Si bug en DEV

```bash
# Corriger sur dev
git checkout dev
# ... fix ...
git commit -m "fix: correction du bug"
git push origin dev
git push hf-api-dev dev:main
git push hf-ui-dev dev:main
```

---

## 3. Migration DEV → PROD

### 3.1 Checklist avant le merge

- [ ] Tests backend OK (`pytest`)
- [ ] Tests frontend OK (`npm test`)
- [ ] Build frontend OK (`npm run build`)
- [ ] Testé sur l'espace DEV (`*-ui-dev.hf.space`)
- [ ] Migrations SQL déjà appliquées sur Supabase PROD (si modification BDD)

### 3.2 Appliquer les migrations PROD (si nécessaire)

```bash
# Si vous avez créé une migration SQL dans dev :
# 1. Aller sur https://supabase.com > PROJET_PROD > SQL Editor
# 2. Exécuter la nouvelle migration
# 3. Vérifier que PROD et DEV sont synchro niveau schéma
```

### 3.3 Merge dev → main

```bash
# ===== ÉTAPE 1 : Mettre main à jour =====
git checkout main
git pull origin main

# ===== ÉTAPE 2 : Merge dev dans main =====
git merge dev

# ===== ÉTAPE 3 : Pousser sur GitHub =====
git push origin main
```

### 3.4 Déployer en PROD

```bash
# ===== ÉTAPE 4 : Déployer le backend =====
git push hf-api main

# ===== ÉTAPE 5 : Déployer le frontend =====
git push hf-ui main
```

⏳ Attendre le build HF (5-10 min).  
🔗 Vérifier sur `https://<USER>-assistant-reussite-ui.hf.space`

### 3.5 Vérifier la production

```bash
# Health check API
curl https://<USER>-assistant-reussite-api.hf.space/health
# → {"status":"ok"}

# Health check complet
curl https://<USER>-assistant-reussite-api.hf.space/health/ready
# → {"status":"healthy","checks":{"database":"ok","embeddings":"ok","llm":"ok"}}

# Ouvrir le frontend dans le navigateur
# https://<USER>-assistant-reussite-ui.hf.space
```

---

## 4. Résumé des commandes

| Action | Commandes |
|--------|-----------|
| **Déployer DEV** | `git push hf-api-dev dev:main && git push hf-ui-dev dev:main` |
| **Merge en PROD** | `git checkout main && git merge dev && git push origin main` |
| **Déployer PROD** | `git push hf-api main && git push hf-ui main` |
| **Les deux d'un coup** | `git push hf-api-dev dev:main && git push hf-ui-dev dev:main && git checkout main && git merge dev && git push origin main && git push hf-api main && git push hf-ui main` |

---

## 5. Dépannage

### Conflit de merge

```bash
git checkout main
git merge dev
# → CONFLICT dans xxx.py
# Résoudre manuellement le conflit dans le fichier
git add xxx.py
git commit -m "merge: résolution conflit dev → main"
git push origin main
```

### Rollback PROD

```bash
# Revenir au commit précédent sur main
git checkout main
git log --oneline -5                # Voir les commits
git revert HEAD                     # Annuler le dernier commit
git push origin main
git push hf-api main
git push hf-ui main
```

### Le build HF échoue

```bash
# 1. Vérifier les logs du Space HF (Settings > Logs)
# 2. Reproduire le build en local :
cd frontend
npm install && npm run build
# 3. Corriger l'erreur
# 4. Repousser
```
