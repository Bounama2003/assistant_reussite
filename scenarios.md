# Scénarios de Notification Push

## Prérequis techniques

Avant qu'un utilisateur puisse recevoir des notifications push, son navigateur doit :

1. **Autoriser les notifications** (permission `granted` dans le navigateur)
2. **Avoir un service worker actif** (enregistré par `vite-plugin-pwa` en prod, ou manuellement en dev)
3. **Être abonné au push** via `POST /notifications/subscribe` (appelé automatiquement par le hook `usePushNotifications` au chargement de la page)
4. **Avoir une clé VAPID valide** configurée dans le backend (via les variables d'environnement ou les valeurs par défaut dans `settings.py`)

---

## Scénario 1 — Upload d'un document (par l'admin)

**Déclencheur** : `POST /upload` — un administrateur uploade un fichier PDF

**Cible** : Tous les **professeurs** de l'école

**Fichier** : `backend/routes/upload.py:46-57`

```python
send_to_school_role(
    role="professor",
    school_id=school_id,
    title="Nouveau document disponible",
    body=f"Un document a été uploadé ({filename})",
    data={"url": "/professor/documents", "type": "document_upload"},
)
```

**Notification reçue** :
- Toast : "Nouveau document disponible" — "Un document a été uploadé (fichier.pdf)"
- Badge cloche s'incrémente
- Notification dans le dropdown et la page `/professor/notifications`

**Comment tester** :
1. Connecte-toi en tant qu'**admin** d'une école
2. Va dans la page d'upload admin
3. Uploade un fichier PDF avec les métadonnées
4. Connecte-toi en tant que **professeur** de la même école → la notification apparaît

---

## Scénario 2 — Upload d'un document (par le professeur)

**Déclencheur** : `POST /professor/upload` — un professeur uploade un fichier PDF

**Cible** : Tous les **autres professeurs** de la même école

**Fichier** : `backend/routes/upload.py:113-124`

```python
send_to_school_role(
    role="professor",
    school_id=school_id,
    title="Nouveau document disponible",
    body=f"{prof.name} a uploadé un document ({filename})",
    data={"url": "/professor/documents", "type": "document_upload"},
)
```

**Notification reçue** :
- Toast : "Nouveau document disponible" — "Amina Sow a uploadé un document (cours.pdf)"
- Badge cloche s'incrémente
- Notification dans le dropdown et la page `/professor/notifications`

**Comment tester** :
1. Connecte-toi en tant que **professeur**
2. Va dans **Mes documents** → **Uploader**
3. Sélectionne un PDF, une matière et une classe
4. Après l'upload, les autres professeurs de l'école reçoivent une notification

---

## Scénario 3 — Feedback négatif d'un étudiant

**Déclencheur** : `POST /reactions` — un étudiant note une réponse ≤ 2/5

**Cible** : Le **professeur concerné** par la réponse notée

**Fichier** : `backend/services/professor_service.py:148-160`

```python
if data.rating is not None and data.rating <= 2 and professor_id is not None:
    send_to_user(
        user_id=professor_id,
        role="professor",
        title="Feedback négatif reçu",
        body=f"Un étudiant a noté une réponse {data.rating}/5.",
        data={"url": "/professor/notifications", "type": "negative_feedback"},
    )
```

**Notification reçue** :
- Toast : "Feedback négatif reçu" — "Un étudiant a noté une réponse 2/5."
- Badge cloche s'incrémente
- Notification dans le dropdown et la page `/professor/notifications`

**Comment tester** :
1. Connecte-toi en tant qu'**étudiant**
2. Va dans le **chat** et envoie un message
3. Une fois la réponse du professeur reçue, note-la avec 1 ou 2 (👎)
4. Le professeur reçoit une notification push

---

## Scénario 4 — Test manuel (curl)

**Déclencheur** : `POST /notifications/test` — envoi manuel via l'API

**Cible** : L'**utilisateur authentifié** par le header

**Fichier** : `backend/routes/notifications.py:107-124`

```python
count = send_to_user(
    user_id, role,
    title="🔔 Notification de test",
    body="Si vous lisez ceci, le push fonctionne !",
    data={"url": None},
)
```

**Notification reçue** :
- Toast : "🔔 Notification de test" — "Si vous lisez ceci, le push fonctionne !"
- Badge cloche s'incrémente

**Comment tester** :
```bash
# En tant que professeur
curl -X POST http://localhost:8000/notifications/test \
  -H "X-Professor-Key: professor-{school_id}-{token}"

# En tant qu'étudiant
curl -X POST http://localhost:8000/notifications/test \
  -H "X-Student-Id: {student_id}"

# En tant qu'admin
curl -X POST http://localhost:8000/notifications/test \
  -H "X-Admin-Key: admin-{school_id}-{token}"

# En tant que super admin
curl -X POST http://localhost:8000/notifications/test \
  -H "X-Super-Admin-Key: {super_admin_key}"
```

---

## Flux technique (backend → frontend)

```
[Backend] send_to_user() / send_to_school_role()
    │
    ▼
[Push Service] webpush() → Mozilla Push Service / Chrome FCM
    │
    ▼
[Service Worker] reçoit l'événement "push"
    │
    ├── Affiche une notification système (Notification API)
    │
    └── postMessage({type: "PUSH_NOTIFICATION"}) → tous les clients window
          │
          ▼
[React] usePushNotifications hook écoute les messages du SW
    │
    ├── useNotificationStore.addNotification() → store Zustand (max 50 items)
    │
    └── useToastStore.info() → toast en haut à droite
          │
          ▼
[UI] NotificationBell (badge + dropdown) + NotificationsPage
```

**Détail du store Zustand** : `src/stores/notificationStore.ts`
- Stocke jusqu'à 50 notifications en mémoire
- Marque les notifications comme lues (individuellement ou tout)
- L'historique est perdu au refresh de la page (stockage mémoire)
- Les notifications historiques (feedback, uploads) sont persistées en base via les tables `notifications` et `reactions`

---

## Points d'entrée API pour les notifications

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/notifications/public-key` | Renvoie la clé publique VAPID |
| `POST` | `/notifications/subscribe` | Enregistre un abonnement push |
| `POST` | `/notifications/unsubscribe` | Supprime un abonnement push |
| `POST` | `/notifications/test` | Envoie une notification de test |
| `GET` | `/professor/notifications` | Liste les notifications historiques du professeur |

## Rôles supportés

| Header d'auth | Rôle | Utilisé par |
|---------------|------|-------------|
| `X-Professor-Key` | `professor` | Professeurs |
| `X-Student-Id` | `student` | Étudiants |
| `X-Admin-Key` | `admin` | Administrateurs d'école |
| `X-Super-Admin-Key` | `superadmin` | Super admin |

## Pages d'affichage des notifications

| Page | Route | Rôle | Type de notifications |
|------|-------|------|----------------------|
| Dropdown (cloche) | — | Tous les rôles authentifiés | Push notifications (temps réel) |
| Page notifications | `/notifications` | `student` | Push notifications |
| Page notifications | `/admin/notifications` | `admin` | Push notifications |
| Page notifications | `/professor/notifications` | `professor` | Push + historiques serveur |
