import logging
import os
import re
from datetime import date

from llama_index.core import (
    Settings,
    StorageContext,
    VectorStoreIndex,
)
from llama_index.core.schema import Document as LlamaDocument
from llama_index.core.vector_stores import MetadataFilters, MetadataFilter, FilterOperator, VectorStoreQuery
from llama_index.core.vector_stores.types import VectorStoreQueryMode
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.groq import Groq
from llama_index.vector_stores.postgres import PGVectorStore
from llama_index.readers.file import PDFReader

from config.settings import settings

logger = logging.getLogger(__name__)

EMBED_DIM = 384

embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
llm = Groq(api_key=settings.groq_api_key, model=settings.groq_model)

Settings.embed_model = embed_model
Settings.llm = llm

DEFAULT_FALLBACK = (
    "Je n'ai pas trouvé la réponse dans tes cours pour le moment. "
    "Assure-toi que ta question est bien liée à tes cours, ou contacte ton professeur pour plus d'aide."
)

GREETING_PATTERNS = re.compile(
    r"^(salut|bonjour|bonsoir|coucou|hey|hello|hi|yo|wesh|salam|slm|cc|qui (es|est)[- ]?tu|c'est quoi ton nom|comment tu t'appelles|tu es qui|presente[- ]?toi|presentation)",
    re.IGNORECASE,
)

IDENTITY_PATTERNS = re.compile(
    r"(qui es[- ]?tu|quel est ton rôle|quel est ton role|tu es qui|c'est quoi ton nom|role de l'assistant|présente[- ]?toi|qui est le directeur|directeur fondateur|directeur actuel|qui (a |a )?fond[éer]|fondateur|l'historique de l'école|l'histoire|t'appelles)",
    re.IGNORECASE,
)

LEAD_ALLOWED_MATIERES = [
    "Règlement Interieur", "Règlement Intérieur", "Reglement Interieur",
    "Programme", "programme", 
    "Adresse", "adresse", 
    "Informations Générales", "Informations Generales",
    "Contactez-Nous", "Contactez Nous", "Contact", 
    "Email", "email", "E-mail", "mail",
    "Téléphone", "Telephone", "Tel", "Téléphone"
]


def _get_school_info(school_id: str) -> dict:
    try:
        from config.database import get_supabase_client
        supabase = get_supabase_client()
        result = supabase.table("schools").select("*").eq("id", school_id).execute()
        if result.data:
            return result.data[0]
    except Exception as e:
        logger.error(f"Failed to fetch school info: {e}")
    today = date.today()
    current_year = today.year
    # Academic year runs Sept-June: if we're past June, next academic year starts
    if today.month >= 9:
        annee = f"{current_year}-{current_year + 1}"
    else:
        annee = f"{current_year - 1}-{current_year}"
    return {
        "id": school_id,
        "name": school_id,
        "nom_directeur": None,
        "directeur_fondateur": None,
        "annee_scolaire_active": annee
    }

def _get_school_name(school_id: str) -> str:
    return _get_school_info(school_id).get("name", school_id)


def _is_greeting(question: str) -> bool:
    return bool(GREETING_PATTERNS.match(question.strip()))


QUIZ_PATTERNS = re.compile(
    r"(quiz|examen|exo|exercise|qcm|test|évaluation|révision|réviser|"
    r"corrige|correct|réponse|vrai|faux|choix multiple|"
    r"question (sur|de)|fais? (un |le )?(quiz|examen|test|exercice)|"
    r"pose (moi )?(des |une )?(questions?|quiz)|entraine|entraînement)",
    re.IGNORECASE
)

MENTOR_PATTERNS = re.compile(
    r"(explique|expliquer|comprendre|comment|pourquoi|"
    r"résumé|récapitule|synthèse|synthetise|"
    r"cours|leçon|chapitre|dm|devoir|tp|td|"
    r"aide|的帮助|m'éclairer|claircir|detail|approfondis|"
    r"exemple|application|exercice corrigé|comprends|développes)",
    re.IGNORECASE
)


QUIZ_ANSWER_PATTERNS = re.compile(
    r"^1[\.\)a-z]|^2[\.\)a-z]|^3[\.\)a-z]|^4[\.\)a-z]|^5[\.\)a-z]|"
    r"^(a\)|b\)|c\)|d\)|a\.|b\.|c\.|d\.)|"
    r"reponse|rep|ma|voici mes|"
    r"\d+\s*[-:]\s*[a-dA-D]",
    re.IGNORECASE | re.MULTILINE
)


from pathlib import Path
from typing import Optional, Sequence, Sequence


def _detect_mode(question: str, conversation_history: list[dict] | None = None) -> str:
    q_lower = question.lower()
    
    is_quiz_answer = bool(QUIZ_ANSWER_PATTERNS.search(q_lower))
    
    has_quiz_trigger = QUIZ_PATTERNS.search(q_lower)
    has_mentor = MENTOR_PATTERNS.search(q_lower)
    
    if is_quiz_answer and conversation_history:
        last_msgs = conversation_history[-4:] if len(conversation_history) > 4 else conversation_history
        for msg in last_msgs:
            content_lower = msg.get("content", "").lower()
            if msg.get("role") == "assistant":
                quiz_markers = ["question", "quiz", "q1", "q2", "q3", "q4", "q5", ") a", ") b", ") c", ") d"]
                if any(marker in content_lower for marker in quiz_markers):
                    return "quiz_correct"
    
    if has_quiz_trigger and has_mentor:
        return "both"
    elif has_quiz_trigger:
        return "quiz"
    elif has_mentor:
        return "mentor"
    return "normal"


def _get_student_info(student_id: str) -> dict:
    try:
        from config.database import get_supabase_client
        supabase = get_supabase_client()
        result = supabase.table("students").select("classe, serie, name").eq("id", student_id).execute()
        if result.data:
            return result.data[0]
    except Exception as e:
        logger.error(f"Failed to fetch student info: {e}")
    return {}


def _get_school_greeting(school_id: str) -> str:
    school_info = _get_school_info(school_id)
    name = school_info.get("name", school_id)
    directeur = school_info.get("nom_directeur", "le directeur de l'école")
    return (
        f"Salut ! Je suis l'assistant intelligent de {name}. "
        f"Je suis là pour t'aider à réviser et répondre à tes questions sur tes cours. "
        f"Le directeur actuel de l'école est {directeur}. "
        "Pose-moi n'importe quelle question !"
    )


def _get_school_fallback(school_id: str) -> str:
    name = _get_school_name(school_id)
    return (
        f"Désolé, je n'ai pas trouvé d'information sur ce sujet dans les cours de {name}. "
        "Essaie de poser une question liée à tes matières ou contacte ton professeur pour plus de détails."
    )


def _build_pg_vector_store() -> PGVectorStore:
    if not settings.database_url:
        raise ValueError("DATABASE_URL is not set in environment variables")
    
    # Ensure the connection string is clean (no quotes)
    base_url = settings.database_url.replace("postgres://", "postgresql://").strip("'").strip('"')
    
    # LlamaIndex PGVectorStore requires an explicit async connection string for the asyncpg driver.
    # We build it by replacing the scheme.
    async_url = base_url.replace("postgresql://", "postgresql+asyncpg://")
    
    # We use the constructor directly to avoid buggy logic in from_params 
    # which fails when only connection_string is provided without its async counterpart.
    return PGVectorStore(
        connection_string=base_url,
        async_connection_string=async_url,
        table_name="documents",
        schema_name="public",
        embed_dim=EMBED_DIM,
        hybrid_search=False,
    )


def _get_vector_store():
    return _build_pg_vector_store()


def ingest_pdf(file_path: str, school_id: str, matiere: str | None = None, classe: str | None = None, professeur: str | None = None, annee_scolaire: str | None = None, public: bool = True) -> int:
    reader = PDFReader()
    docs = reader.load_data(file=Path(file_path))

    metadata: dict = {"school_id": school_id}
    if matiere:
        metadata["matiere"] = matiere
    if classe:
        metadata["classe"] = classe
    if professeur:
        metadata["professeur"] = professeur
    if annee_scolaire:
        metadata["annee_scolaire"] = annee_scolaire
    metadata["public"] = public
    metadata["filename"] = os.path.basename(file_path)

    for doc in docs:
        doc.metadata.update(metadata)

    vector_store = _get_vector_store()
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    index = VectorStoreIndex.from_documents(
        docs,
        storage_context=storage_context,
        show_progress=True,
    )
    return len(docs)


def query_rag(question: str, school_id: str, student_id: str | None = None, student_classe: str | None = None, student_name: str | None = None, conversation_history: list[dict] | None = None):
    school_info = _get_school_info(school_id)
    school_name = school_info.get("name", school_id)
    
    # Secure access to director names (handle None)
    nom_directeur = school_info.get("nom_directeur") or "non spécifié"
    directeur_fondateur = school_info.get("directeur_fondateur") or "non spécifié"
    annee_scolaire_active = school_info.get("annee_scolaire_active", "2025-2026")
    contact_email = school_info.get("contact_email", "non spécifié")

    # 1. Handle greeting and identity questions
    if _is_greeting(question):
        return _get_school_greeting(school_id), []
    
    if IDENTITY_PATTERNS.search(question):
        # Professional greeting based on role
        if not student_id:
            role_text = "Je peux t'aider à découvrir l'école, consulter le programme ou le règlement intérieur."
        else:
            role_text = "Mon rôle est de t'aider à réviser et répondre à tes questions sur tes cours."
            
        intro = f"Je suis l'assistant intelligent de l'école {school_name}. {role_text} "
        
        details = []
        if nom_directeur != "non spécifié":
            details.append(f"Le directeur actuel est {nom_directeur}")
        if directeur_fondateur != "non spécifié":
            details.append(f"le directeur fondateur est {directeur_fondateur}")
            
        if details:
            intro += ". ".join(details) + ". "
            
        intro += "Je suis là pour t'accompagner !"
        return intro, []

    # 2. Lead access control: filter documents to allowed matieres only
    lead_mode = not student_id

    if student_id:
        student_info = _get_student_info(student_id)
        if student_classe is None:
            student_classe = student_info.get("classe") or student_info.get("serie")
        student_name = student_info.get("name")
    else:
        student_name = None
        # Lead asks about contact - give directly from school info
        if re.search(r"contact|email|téléphone|phone|appeler|joindre|renseigner", question, re.IGNORECASE):
            contact_info = f"Pour contacter l'école {school_name}: "
            if contact_email and contact_email != "non spécifié":
                contact_info += f"vous pouvez écrire à {contact_email}."
            else:
                contact_info = f"Veuillez contacter l'administration scolaires pour plus d'informations."
            return contact_info, []

    query_mode = _detect_mode(question, conversation_history)

    # 4. Build metadata filters
    base_filters = [
        MetadataFilter(key="school_id", value=school_id, operator=FilterOperator.EQ),
        MetadataFilter(key="annee_scolaire", value=annee_scolaire_active, operator=FilterOperator.EQ),
    ]

    # 5. RAG query
    vector_store = _get_vector_store()
    query_embedding = embed_model.get_text_embedding(question)
    
    final_nodes_with_scores = []

    if lead_mode:
        # Lead: access only allowed matieres that are marked public
        query = VectorStoreQuery(
            query_embedding=query_embedding,
            similarity_top_k=15,
            mode=VectorStoreQueryMode.DEFAULT,
            filters=MetadataFilters(filters=[
                *base_filters,
                MetadataFilter(key="matiere", value=LEAD_ALLOWED_MATIERES, operator=FilterOperator.IN)
            ]),
        )
        result = vector_store.query(query)
        nodes = result.nodes or []
        similarities = result.similarities or [0.0] * len(nodes)
        
        for i, node in enumerate(nodes):
            if node.metadata.get("public") == True:
                final_nodes_with_scores.append({"node": node, "score": float(similarities[i] or 0.0)})
        
        # Truncate to top 5
        final_nodes_with_scores = final_nodes_with_scores[:5]
    else:
        # Student: access their class docs + all public docs
        
        # Query A: Class specific docs
        query_class = VectorStoreQuery(
            query_embedding=query_embedding,
            similarity_top_k=10,
            mode=VectorStoreQueryMode.DEFAULT,
            filters=MetadataFilters(filters=[
                *base_filters,
                MetadataFilter(key="classe", value=student_classe, operator=FilterOperator.EQ)
            ]),
        )
        result_class = vector_store.query(query_class)
        nodes_class = result_class.nodes or []
        sim_class = result_class.similarities or [0.0] * len(nodes_class)
        
        # Query B: All public docs (public=True, any matiere)
        query_public = VectorStoreQuery(
            query_embedding=query_embedding,
            similarity_top_k=15,
            mode=VectorStoreQueryMode.DEFAULT,
            filters=MetadataFilters(filters=base_filters),
        )
        result_public = vector_store.query(query_public)
        nodes_public = result_public.nodes or []
        sim_public = result_public.similarities or [0.0] * len(nodes_public)
        
        # Merge candidates
        candidates = []
        for i, node in enumerate(nodes_class):
            candidates.append({"node": node, "score": float(sim_class[i] or 0.0)})
        
        for i, node in enumerate(nodes_public):
            if node.metadata.get("public") == True:
                candidates.append({"node": node, "score": float(sim_public[i] or 0.0)})
        
        # Deduplicate and sort
        seen_ids = set()
        candidates.sort(key=lambda x: x["score"], reverse=True)
        
        for cand in candidates:
            if cand["node"].node_id not in seen_ids:
                seen_ids.add(cand["node"].node_id)
                final_nodes_with_scores.append(cand)
                if len(final_nodes_with_scores) >= 7:
                    break

    nodes = [ns["node"] for ns in final_nodes_with_scores]

    if not nodes:
        if student_classe:
            no_class_filter_seq: Sequence[MetadataFilter] = [
                MetadataFilter(key="school_id", value=school_id, operator=FilterOperator.EQ),
                MetadataFilter(key="annee_scolaire", value=annee_scolaire_active, operator=FilterOperator.EQ),
            ]
            query_no_class = VectorStoreQuery(
                query_embedding=query_embedding,
                similarity_top_k=5,
                mode=VectorStoreQueryMode.DEFAULT,
                filters=MetadataFilters(filters=list(no_class_filter_seq)),
            )
            result_no_class = vector_store.query(query_no_class)
            
            if result_no_class.nodes:
                return (
                    f"Désolé, je n'ai pas de contenu sur ce sujet pour la classe de {student_classe}. "
                    f"Le contenu publié concerne peut-être une autre classe. "
                    f"Si tu penses que ce sujet devrait être dans ton programme, demande à ton professeur.",
                    []
                )
        
        return _get_school_fallback(school_id), []

    # 6. Build context with professor info
    context_parts = []
    for node in nodes:
        node_text = getattr(node, 'text', '') or ''
        prof = node.metadata.get("professeur") or node.metadata.get("auteur")
        matiere = node.metadata.get("matiere", "Module")
        
        if prof and prof.strip():
            source = f"[Module de {matiere} par {prof}]"
        else:
            source = f"[{matiere}]"
        
        context_parts.append(f"{source}\n{node_text}")
    
    context_str = "\n\n---\n\n".join(context_parts)

# 7. Build system context and prompt
    student_info_parts = []
    if student_name:
        student_info_parts.append(f"Prénom: {student_name}")
    if student_classe:
        student_info_parts.append(f"Classe: {student_classe}")
    student_info_str = ", ".join(student_info_parts) if student_info_parts else "Non spécifié"
    
    system_context = (
        f"### IDENTITÉ\n"
        f"Tu es l'assistant virtuel de l'école {school_name}.\n\n"
        f"### INFO ÉCOLE\n"
        f"Directeur: {nom_directeur}, Fondateur: {directeur_fondateur}, Année: {annee_scolaire_active}\n\n"
        f"### INFO ÉLÈVE\n"
        f"{student_info_str}\n\n"
    )

    if lead_mode:
        email_info = f"Email de contact de l'école: {contact_email}" if contact_email and contact_email != "non spécifié" else ""
        system_context += (
            "### CONTEXTE POUR PROSPECT\n"
            "Tu es un prospect (non inscrit). Tu n'as PAS accès aux cours.\n"
            f"{email_info}\n\n"
            "Tu peux répondre aux questions générales sur l'école (programme, réglement, adresse, etc.).\n"
            "Pour les cours, dis que tu n'as pas accès car tu n'es pas inscrit.\n"
            "N'utilise JAMAIS tes connaissances personnelles pour les cours.\n\n"
        )
    else:
        name_instruction = "1. S'adresse à l'élève par son prénom une seule fois au debut" if student_name else "1. Ne mentionne pas le nom de l'élève"
        email_info = f"Email de l'école: {contact_email}" if contact_email and contact_email != "non spécifié" else ""
        system_context += (
            "### REGLES\n"
            f"{name_instruction}\n"
            "2. Ne dis pas 'élève de Terminale' ou 'élève de 3e' - utilise juste 'tu' ou 'vous'\n"
            "2b. Ne repete pas le prenom de l'eleve dans chaque phrase\n"
            "3. Reponds uniquement avec le contexte fourni\n"
            f"4. Cite le professeur une fois au debut si connu\n"
            "5. Pas de 'auteur inconnu'\n"
            "6. Utilise des puces et des numérotations\n"
            f"{email_info}\n\n"
        )
        
        if query_mode == "quiz":
            system_context += (
                "### MODE QUIZ/EXAMEN\n"
                "L'élève veut s'entraîner pour un examen.\n"
                "- Pose des questions sur le contenu fourni (3-5 questions)\n"
                "- Après chaque réponse de l'élève, corrige et explique\n"
                "- Utilise un format: Question → Réponse élève → Correction + Explication\n"
                "- Termine par un résumé des points à revoir\n\n"
            )
        elif query_mode == "mentor":
            system_context += (
                "### MODE MENTOR/RÉVISION\n"
                "L'élève veut comprendre et réviser ses cours.\n"
                "- Explique le cours de manière claire et pédagogique\n"
                "- Utilise des exemples concrets du contenu fourni\n"
                "- Structured ta réponse: Résumé → Points clés → Exemples → Exercises\n"
                "- Sois encouragement et positif\n\n"
            )
        elif query_mode == "both":
            system_context += (
                "### MODE MIXTE (QUIZ + MENTOR)\n"
                "- Explique d'abord le cours puis propose un petit quiz\n"
                "- Après les réponses, corrige et explique\n\n"
            )
        elif query_mode == "quiz_correct":
            system_context += (
                "### MODE CORRECTION QUIZ\n"
                "L'utilisateur vient de répondre au quiz précédent.\n"
                "SES RÉPONSES SONT: " + question + "\n"
                "- NE PAS poser de nouvelles questions\n"
                "- Corrige chaque réponse de l'élève (Vrai/Faux + explication)\n"
                "- Explique pourquoi la bonne réponse est correcte\n"
                "- Donne des conseils pour progresser\n"
                "- Termine par un résumé des points à revoir\n\n"
            )

    history_str = ""
    if conversation_history:
        history_parts = []
        for msg in conversation_history[-6:]:
            role_label = "Élève" if msg.get("role") == "user" else "Assistant"
            content = msg.get("content", "")[:300]
            history_parts.append(f"{role_label}: {content}")
        if history_parts:
            history_str = "### HISTORIQUE DE LA CONVERSATION\n" + "\n".join(history_parts) + "\n\n"
    
    prompt = (
        f"{system_context}\n"
        f"{history_str}"
        "### DOCUMENTATION FOURNIE\n"
        "---\n"
        "{context_str}\n"
        "---\n"
        "Fin de la documentation.\n\n"
        "### QUESTION\n"
        "{query_str}\n\n"
        "### REPONSE (based only on documentation above)\n"
    ).format(context_str=context_str, query_str=question)

    # 8. Call LLM with error handling
    try:
        llm_response = llm.complete(prompt)
    except Exception as e:
        error_msg = str(e).lower()
        if "429" in error_msg or "rate limit" in error_msg or "quota" in error_msg:
            logger.warning(f"Groq rate limit hit: {e}")
            return (
                "🚫 Oups ! J'ai atteint la limite de requêtes de l'IA pour le moment. "
            
                "Réessaie dans quelques instants ou contacte l'administrateur.",
                []
            )
        if "timeout" in error_msg or "connection" in error_msg:
            logger.error(f"Groq connection error: {e}")
            return (
                "🔌 Problème de connexion à l'IA. Vérifie ta connexion internet et réessaie.",
                []
            )
        logger.error(f"Groq unexpected error: {e}", exc_info=True)
        return (
            "⚠️ Désolé, une erreur inattendue s'est produite. Réessaie dans un moment.",
            []
        )

    answer = str(llm_response).strip()

    # 9. Build sources with professor info
    sources = []
    for ns in final_nodes_with_scores:
        node = ns["node"]
        node_text = (getattr(node, 'text', '') or '')[:300]
        sources.append({
            "content": node_text,
            "metadata": node.metadata,
            "score": ns["score"],
            "professeur": node.metadata.get("professeur", "Auteur inconnu")
        })

    if not answer or answer.lower() in ("none", "null", "empty response", ""):
        answer = _get_school_fallback(school_id)

    return answer, sources


import json
from typing import Generator


def query_rag_stream(
    question: str,
    school_id: str,
    student_id: str | None = None,
    student_classe: str | None = None,
    student_name: str | None = None,
    conversation_history: list[dict] | None = None,
) -> Generator[str, None, None]:
    """
    Streaming version of query_rag.
    Yields SSE-formatted JSON events:
      - {"type":"token","content":"..."} for each LLM token
      - {"type":"sources","sources":[...]} at the end
      - {"type":"error","content":"..."} on failure
    """
    import json

    school_info = _get_school_info(school_id)
    school_name = school_info.get("name", school_id)
    nom_directeur = school_info.get("nom_directeur") or "non spécifié"
    directeur_fondateur = school_info.get("directeur_fondateur") or "non spécifié"
    annee_scolaire_active = school_info.get("annee_scolaire_active", "2025-2026")
    contact_email = school_info.get("contact_email", "non spécifié")

    # 1. Handle greeting and identity questions (non-streamable — send complete)
    if _is_greeting(question):
        answer = _get_school_greeting(school_id)
        yield f"data: {json.dumps({'type': 'token', 'content': answer})}\n\n"
        yield f"data: {json.dumps({'type': 'sources', 'sources': []})}\n\n"
        return

    if IDENTITY_PATTERNS.search(question):
        if not student_id:
            role_text = "Je peux t'aider à découvrir l'école, consulter le programme ou le règlement intérieur."
        else:
            role_text = "Mon rôle est de t'aider à réviser et répondre à tes questions sur tes cours."
        intro = f"Je suis l'assistant intelligent de l'école {school_name}. {role_text} "
        details = []
        if nom_directeur != "non spécifié":
            details.append(f"Le directeur actuel est {nom_directeur}")
        if directeur_fondateur != "non spécifié":
            details.append(f"le directeur fondateur est {directeur_fondateur}")
        if details:
            intro += ". ".join(details) + ". "
        intro += "Je suis là pour t'accompagner !"
        yield f"data: {json.dumps({'type': 'token', 'content': intro})}\n\n"
        yield f"data: {json.dumps({'type': 'sources', 'sources': []})}\n\n"
        return

    # 2. Lead access control
    lead_mode = not student_id

    if student_id:
        student_info = _get_student_info(student_id)
        if student_classe is None:
            student_classe = student_info.get("classe") or student_info.get("serie")
        student_name = student_info.get("name")
    else:
        student_name = None
        if re.search(r"contact|email|téléphone|phone|appeler|joindre|renseigner", question, re.IGNORECASE):
            contact_info = f"Pour contacter l'école {school_name}: "
            if contact_email and contact_email != "non spécifié":
                contact_info += f"vous pouvez écrire à {contact_email}."
            else:
                contact_info = f"Veuillez contacter l'administration de l'école pour plus d'informations."
            yield f"data: {json.dumps({'type': 'token', 'content': contact_info})}\n\n"
            yield f"data: {json.dumps({'type': 'sources', 'sources': []})}\n\n"
            return

    # 3. Build metadata filters
    base_filters = [
        MetadataFilter(key="school_id", value=school_id, operator=FilterOperator.EQ),
        MetadataFilter(key="annee_scolaire", value=annee_scolaire_active, operator=FilterOperator.EQ),
    ]

    vector_store = _get_vector_store()
    query_embedding = embed_model.get_text_embedding(question)
    final_nodes_with_scores = []

    if lead_mode:
        query = VectorStoreQuery(
            query_embedding=query_embedding,
            similarity_top_k=15,
            mode=VectorStoreQueryMode.DEFAULT,
            filters=MetadataFilters(filters=[
                *base_filters,
                MetadataFilter(key="matiere", value=LEAD_ALLOWED_MATIERES, operator=FilterOperator.IN)
            ]),
        )
        result = vector_store.query(query)
        nodes = result.nodes or []
        similarities = result.similarities or [0.0] * len(nodes)
        for i, node in enumerate(nodes):
            if node.metadata.get("public") == True:
                final_nodes_with_scores.append({"node": node, "score": float(similarities[i] or 0.0)})
        final_nodes_with_scores = final_nodes_with_scores[:5]
    else:
        query_class = VectorStoreQuery(
            query_embedding=query_embedding,
            similarity_top_k=10,
            mode=VectorStoreQueryMode.DEFAULT,
            filters=MetadataFilters(filters=[
                *base_filters,
                MetadataFilter(key="classe", value=student_classe, operator=FilterOperator.EQ)
            ]),
        )
        result_class = vector_store.query(query_class)
        nodes_class = result_class.nodes or []
        sim_class = result_class.similarities or [0.0] * len(nodes_class)

        query_public = VectorStoreQuery(
            query_embedding=query_embedding,
            similarity_top_k=15,
            mode=VectorStoreQueryMode.DEFAULT,
            filters=MetadataFilters(filters=base_filters),
        )
        result_public = vector_store.query(query_public)
        nodes_public = result_public.nodes or []
        sim_public = result_public.similarities or [0.0] * len(nodes_public)

        candidates = []
        for i, node in enumerate(nodes_class):
            candidates.append({"node": node, "score": float(sim_class[i] or 0.0)})
        for i, node in enumerate(nodes_public):
            if node.metadata.get("public") == True:
                candidates.append({"node": node, "score": float(sim_public[i] or 0.0)})

        seen_ids = set()
        candidates.sort(key=lambda x: x["score"], reverse=True)
        for cand in candidates:
            if cand["node"].node_id not in seen_ids:
                seen_ids.add(cand["node"].node_id)
                final_nodes_with_scores.append(cand)
                if len(final_nodes_with_scores) >= 7:
                    break

    nodes = [ns["node"] for ns in final_nodes_with_scores]

    if not nodes:
        fallback = _get_school_fallback(school_id)
        yield f"data: {json.dumps({'type': 'token', 'content': fallback})}\n\n"
        yield f"data: {json.dumps({'type': 'sources', 'sources': []})}\n\n"
        return

    # 4. Build context
    context_parts = []
    for node in nodes:
        node_text = getattr(node, 'text', '') or ''
        prof = node.metadata.get("professeur") or node.metadata.get("auteur")
        matiere = node.metadata.get("matiere", "Module")
        if prof and prof.strip():
            source = f"[Module de {matiere} par {prof}]"
        else:
            source = f"[{matiere}]"
        context_parts.append(f"{source}\n{node_text}")
    context_str = "\n\n---\n\n".join(context_parts)

    # 5. Build system prompt
    student_info_parts = []
    if student_name:
        student_info_parts.append(f"Prénom: {student_name}")
    if student_classe:
        student_info_parts.append(f"Classe: {student_classe}")
    student_info_str = ", ".join(student_info_parts) if student_info_parts else "Non spécifié"

    system_context = (
        f"### IDENTITÉ\n"
        f"Tu es l'assistant virtuel de l'école {school_name}.\n\n"
        f"### INFO ÉCOLE\n"
        f"Directeur: {nom_directeur}, Fondateur: {directeur_fondateur}, Année: {annee_scolaire_active}\n\n"
        f"### INFO ÉLÈVE\n"
        f"{student_info_str}\n\n"
    )

    if lead_mode:
        email_info = f"Email de contact de l'école: {contact_email}" if contact_email and contact_email != "non spécifié" else ""
        system_context += (
            "### CONTEXTE POUR PROSPECT\n"
            "Tu es un prospect (non inscrit). Tu n'as PAS accès aux cours.\n"
            f"{email_info}\n\n"
            "Tu peux répondre aux questions générales sur l'école (programme, règlement, adresse, etc.).\n"
            "Pour les cours, dis que tu n'as pas accès car tu n'es pas inscrit.\n"
            "N'utilise JAMAIS tes connaissances personnelles pour les cours.\n\n"
        )
    else:
        name_instruction = "1. S'adresse à l'élève par son prénom une seule fois au début" if student_name else "1. Ne mentionne pas le nom de l'élève"
        email_info = f"Email de l'école: {contact_email}" if contact_email and contact_email != "non spécifié" else ""
        system_context += (
            "### REGLES\n"
            f"{name_instruction}\n"
            "2. Ne dis pas 'élève de Terminale' ou 'élève de 3e' - utilise juste 'tu' ou 'vous'\n"
            "2b. Ne répète pas le prénom de l'élève dans chaque phrase\n"
            "3. Réponds uniquement avec le contexte fourni\n"
            f"4. Cite le professeur une fois au début si connu\n"
            "5. Pas de 'auteur inconnu'\n"
            "6. Utilise des puces et des numérotations\n"
            f"{email_info}\n\n"
        )

        query_mode = _detect_mode(question, conversation_history)
        if query_mode == "quiz":
            system_context += "### MODE QUIZ/EXAMEN\nL'élève veut s'entraîner pour un examen.\n- Pose des questions sur le contenu fourni (3-5 questions)\n- Après chaque réponse de l'élève, corrige et explique\n- Termine par un résumé des points à revoir\n\n"
        elif query_mode == "mentor":
            system_context += "### MODE MENTOR/RÉVISION\nL'élève veut comprendre et réviser ses cours.\n- Explique le cours de manière claire et pédagogique\n- Utilise des exemples concrets\n- Structure ta réponse: Résumé → Points clés → Exemples → Exercices\n\n"
        elif query_mode == "both":
            system_context += "### MODE MIXTE (QUIZ + MENTOR)\n- Explique d'abord le cours puis propose un petit quiz\n\n"
        elif query_mode == "quiz_correct":
            system_context += "### MODE CORRECTION QUIZ\nSES RÉPONSES SONT: " + question + "\n- NE PAS poser de nouvelles questions\n- Corrige chaque réponse\n\n"

    history_str = ""
    if conversation_history:
        history_parts = []
        for msg in conversation_history[-6:]:
            role_label = "Élève" if msg.get("role") == "user" else "Assistant"
            content = msg.get("content", "")[:300]
            history_parts.append(f"{role_label}: {content}")
        if history_parts:
            history_str = "### HISTORIQUE DE LA CONVERSATION\n" + "\n".join(history_parts) + "\n\n"

    prompt = (
        f"{system_context}\n"
        f"{history_str}"
        "### DOCUMENTATION FOURNIE\n"
        "---\n"
        "{context_str}\n"
        "---\n"
        "Fin de la documentation.\n\n"
        "### QUESTION\n"
        "{query_str}\n\n"
        "### REPONSE (based only on documentation above)\n"
    ).format(context_str=context_str, query_str=question)

    # 6. Stream LLM response
    try:
        stream_response = llm.stream_complete(prompt)
        for chunk in stream_response:
            token = chunk.delta or chunk.text or ""
            if token:
                yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
    except Exception as e:
        error_msg = str(e).lower()
        logger.error(f"Groq stream error: {e}")
        if "429" in error_msg or "rate limit" in error_msg or "quota" in error_msg:
            fallback = "🚫 Oups ! J'ai atteint la limite de requêtes de l'IA pour le moment. Réessaie dans quelques instants."
        elif "timeout" in error_msg or "connection" in error_msg:
            fallback = "🔌 Problème de connexion à l'IA. Vérifie ta connexion internet et réessaie."
        else:
            fallback = "⚠️ Désolé, une erreur inattendue s'est produite. Réessaie dans un moment."
        yield f"data: {json.dumps({'type': 'token', 'content': fallback})}\n\n"
        yield f"data: {json.dumps({'type': 'sources', 'sources': []})}\n\n"
        return

    # 7. Build and send sources
    sources = []
    for ns in final_nodes_with_scores:
        node = ns["node"]
        node_text = (getattr(node, 'text', '') or '')[:300]
        sources.append({
            "content": node_text,
            "metadata": node.metadata,
            "score": ns["score"],
            "professeur": node.metadata.get("professeur", "Auteur inconnu")
        })
    yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"
