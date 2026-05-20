🔴 CRITIQUE (à corriger ABSOLUMENT avant production)
1. schema.sql utilise vector(1536) alors que le modèle est BGE-small (384d)
- Fichier : supabase/schema.sql ligne 34
- Risque : Si quelqu'un exécute ce fichier par erreur (au lieu de clean_migration.sql), la base est corrompue — les embeddings 384d seront stockés dans une colonne vector(1536), rendant la recherche vectorielle inopérante
- AGENTS.md le mentionne explicitement : "Never use supabase/schema.sql — it uses different vector dimensions (1536 vs actual 384)"
- Fix : Supprimer ou corriger schema.sql, ou ajouter un check au démarrage de l'app
2. .env.example contient un mot de passe en clair
- Fichier : .env.example ligne 26
- Contenu : sup_pwd=bbounama2100
- Risque : Si ce fichier est commité (il est dans .gitignore mais quand même), c'est une fuite de credential
- Fix : Supprimer cette ligne
3. Aucune limite de taille sur les uploads de fichiers
- Fichier : backend/routes/upload.py
- Risque : Un utilisateur malveillant peut uploader un fichier PDF de plusieurs Go et saturer le disque. Aucune vérification de taille, ni de MIME type (seulement l'extension .pdf)
- Fix : Ajouter max_size sur le UploadFile et vérifier le magic bytes du PDF
4. Sentry enregistre 100% des transactions
- Fichier : backend/main.py lignes 42-43
- Code : traces_sample_rate=1.0 et profiles_sample_rate=1.0
- Risque : En production, ça va générer des coûts Sentry très élevés et du overhead sur chaque requête
- Fix : traces_sample_rate=0.1 (10%) et profiles_sample_rate=0.0
5. Pas de protection CSRF
- Aucun middleware CSRF n'est configuré
- Risque : Bien que l'API utilise des tokens d'auth dans les headers, un attaquant pourrait potentiellement faire des requêtes cross-site
- Fix : Ajouter un middleware CSRF ou au moins vérifier l'origin header
6. Dual auth system (AuthContext + authStore) — désync possible
- Fichiers : src/stores/authStore.ts (Zustand persist) + src/contexts/AuthContext.tsx (React Context)
- Risque : Les deux systèmes maintiennent un état parallèle. Une mise à jour dans l'un sans l'autre peut causer des incohérences
- Fix : Unifier en un seul système (AGENTS.md le mentionne)
7. Aucune déconnexion auto sur 401
- Fichier : frontend/src/services/api.ts lignes 30-38
- Code : Le intercepteur log juste l'erreur 403, mais ne déconnecte pas l'utilisateur
- Risque : Si un token est révoqué, l'utilisateur continue à voir une UI fonctionnelle avec des appels API qui échouent silencieusement
- Fix : Ajouter un intercepteur qui appelle useAuthStore.getState().logout() sur 401
8. Constraint check_valid_classe trop restrictive
- Fichier : supabase/migration_add_school_fields.sql lignes 44-46
- Code : CHECK (classe IN ('3e', 'TL1', 'TS2', 'TS1', 'TL2') OR classe IS NULL)
- Risque : Les écoles peuvent avoir des noms de classe personnalisés. Cette contrainte va bloquer toute création d'étudiant avec une classe hors de cette liste
- Fix : Supprimer la contrainte CHECK ou la rendre configurable par école
🟠 HAUTE PRIORITÉ
9. Rate limiting insuffisant
- Seuls 3 endpoints ont du rate limiting : /chat (30/min), /student/login (5/min), /quiz
- Risque : Les endpoints admin, professor, upload, etc. sont sans protection contre le brute-force
- Fix : Ajouter @limiter.limit() sur tous les endpoints sensibles
10. updated_at = "now()" est une chaîne littérale, pas la fonction SQL
- Fichiers : services/chat_session_service.py:92, services/school_service.py:158
- Code : supabase.table("x").update({"updated_at": "now()"}) — PostgREST envoie ça comme la chaîne "now()" pas la fonction NOW()
- Fix : Utiliser supabase.table("x").update({"updated_at": "now()"}).execute() avec PostgREST qui interprète les mots-clés, ou envoyer une date explicite
11. N+1 queries et O(n) en Python
- Fichier : services/professor_service.py:185-211 — charge TOUS les data_documents en mémoire puis filtre en Python
- Fichier : services/school_service.py:84-97 — idem
- Impact : Avec 10K+ documents, l'API stats devient très lente
12. Aucun Error Boundary React
- Aucun ErrorBoundary n'enveloppe les pages lazy-loadées
- Risque : Si une page crash, tout le layout plante (page blanche)
- Fix : Ajouter un ErrorBoundary global dans AppLayout.tsx
13. Aucun CI/CD, pas de Dockerfile
- Aucun fichier Docker, aucun pipeline GitHub Actions, aucun script de déploiement
- Risque : Déploiement manuel = risque d'erreur humaine et pas de reproductibilité
14. Clés VAPID en dur dans settings.py
- Fichier : backend/config/settings.py lignes 21-22
- Des clés VAPID de dev sont codées en dur comme valeurs par défaut
- Risque : Si le .env n'a pas les clés configurées, le push utilise des clés connues de tous
- Fix : Les rendre obligatoires (vapid_public_key: str = Field(...)) ou générées automatiquement
🟡 MOYENNE PRIORITÉ
#	Problème
15	Pas de type checking backend
16	Test coverage faible
17	notifications_subscriptions.user_id n'est pas une FK
18	Pas de Dockerfile
19	Index manquant sur schools.is_suspended
20	fpdf2 dans requirements.txt
21	Auth tokens stockés en localStorage
✅ CE QUI EST BON (points forts)
Domaine
TypeScript
PWA
Logging
Structure
Sentry
Tests API
Migrations
Health checks
Upload multi-classes
Notifications push
TEMPS ESTIMÉ POUR LA MISE EN PROD
Lot
🔴 8 critiques
🟠 6 haute priorité
🟡 7 moyenne
Total
Conclusion : L'application est en bonne santé architecturale mais les problèmes de sécurité (upload sans limite, tokens persistants en localStorage, CSRF, schema.sql piégé, Sentry à 100%) rendent le passage en production risqué. Compter 1 semaine de travail ciblé pour être prêt.