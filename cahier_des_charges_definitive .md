# Cahier des Charges : Plateforme

# "Assistant Réussite" (SaaS)

## 1. Vision du Projet

Créer une plateforme de tutorat IA en marque blanche perme**�**ant aux établissementsscolaires (UPEPS, CPD, etc.) d'o**�**rir à leurs élèves un assistant intelligent entraîné exclusivement

sur leurs propres supports pédagogiques.

## 2. Architecture Technique "Bootstrap & Scalable"

| Composant | Technologie | Rôle |
| --- | --- | --- |
| Frontend | Streamlit (PWA) | Interface utilisateur installable, personnalisable par école. |
| Backend API | FastAPI | Cerveau de l'application, gestion du RAG et de la |

sécurité.

| Moteur IA | LlamaIndex | Orchestration des documents et recherche vectorielle. |
| --- | --- | --- |
| LLM (Cerveau) | Groq (Llama 3.1) | Phase Test : Gratuit & Rapide. Phase Prod : OpenRouter. |
| Base de Données | Supabase (PGVector) | Stockage des vecteurs, des pro � ls écoles et des leads. |

Hébergement Streamlit Cloud + Railway _Déploiement agile et peucoûteux._

## 3. Spéci�cations Fonctionnelles

### A. Interface Élève (Multi-École)

- **●** _Accès Dynamique :_ L'application détecte l'école via un paramètre URL (ex:app.ia.sn/?school=upeps).
- _●_ _Personnalisation "White Label" :_ A**�**chage automatique du logo et des couleurs del'établissement (ou logo par défaut du développeur).
- **●** _Capture de Leads :_ Formulaire obligatoire (Nom, Prénom, Téléphone, Série) pouraccéder à l'IA.
- **●** _Chat Intelligent :_ Réponses sourcées (cite le fascicule de l'école).
### B. Interface Administration (Directeur)

- **●** _Gestion du Branding :_ Possibilité d'uploader un logo pour remplacer le logo par défaut.
- **●** _Base de Connaissances :_ Upload de nouveaux PDF (fascicules, épreuves) sans toucherau code.
- _●_ _Accès aux Leads :_ Tableau de bord a**�**chant la liste des élèves intéressés pour relancecommerciale.
### C. Le Moteur RAG (Intelligence)

- **●** _Filtrage Métadonnées :_ L'IA ne répond qu'en utilisant les documents liés au school_id del'utilisateur.
- _●_ _Mode O_**�**_ine (PWA) :_ Icône sur l'écran d'accueil du téléphone pour un accès rapide.
## 4. Organisation des Données (Supabase)

Pour automatiser sans modi**�**er le code, nous utilisons trois tables principales :

_1._ _Table schools :_**○** id (ex: upeps_01)
**○** name (ex: UPEPS)**○** logo_url (URL vers le storage)

**○** _primary_color (code hex)__2._ Table documents (Vecteurs) :

**○** content (Texte du cours)

**○** embedding (Vecteur)**○** metadata (JSON contenant school_id, matiere, classe)

_3._ _Table leads :_**○** student_name, phone, school_id, timestamp.
## 5. Plan de Développement (4 Semaines)

### Semaine 1 : Backend & Ingestion Automatisée

- **●** Con_�_guration de Supabase et FastAPI.
- **●** Création du script d'ingestion qui taggue automatiquement les PDF avec le school_id.
- **●** Test du moteur RAG avec les fascicules de l'UPEPS.
### Semaine 2 : API & Personnalisation

- **●** Développement des routes FastAPI pour le Chat et l'Admin.
- **●** Mise en place de la logique de "White Label" (logo dynamique).
- **●** Connexion à Groq (Version gratuite).
### Semaine 3 : Frontend Streamlit & PWA

- **●** Création de l'interface de Chat mobile-_�_rst.
- **●** Injection du manifest.json pour rendre l'app installable.
- **●** Gestion des paramètres d'URL pour le multi-écoles.
### Semaine 4 : Déploiement & Tests

- **●** Mise en ligne du Backend (Railway) et du Frontend (Streamlit Cloud).
- **●** Démo "Live" avec le directeur de l'UPEPS.
- **●** Collecte des premiers feedbacks élèves.
## 6. Modèle Économique (SaaS)

- **●** _Coût de lancement :_ 0 FCFA (utilisation des tiers gratuits).
- **●** Facturation Client (UPEPS) :**○** _Frais de mise en service :_ _150 000 FCFA._
**○** Abonnement Maintenance : _30 000 FCFA / mois._

- **●** _Évolution Prod :_ Passage sur _OpenRouter_ (Pay-as-you-go) dès le premier paiementreçu pour garantir la scalabilité (coût estimé : < 2 000 FCFA/mois pour 500 utilisateurs).

## 7. Risques et Solutions

- **●** Saturation du CPU (Ollama) : _Résolu par l'utilisation de_ Groq/OpenRouter _en mode API._
- **●** _Mélange des cours entre écoles :_ Résolu par le _�_ltrage strict des _Metadata_ dansLlamaIndex.
- **●** _Instabilité Internet :_ Résolu par le format _PWA_ qui est plus léger qu'un site webclassique.
