#!/usr/bin/env python3
"""
Script d'ingestion PDF pour Assistant Réussite.

Usage:
    python scripts/ingest.py --school upeps_01 --file cours_math.pdf --matiere Math --classe Terminale
    python scripts/ingest.py --school upeps_01 --folder ./fascicules/ --matiere Physique
    python scripts/ingest.py --school cpd_01 --file examens.pdf

Ce script utilise LlamaIndex pour chunker les PDF, générer des embeddings,
et les stocker dans Supabase PGVector.
"""

import argparse
import asyncio
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from config.settings import settings
from rag.engine import ingest_pdf


def ingest_single_file(file_path: str, school_id: str, matiere: str = None, classe: str = None, professeur: str = None, annee_scolaire: str = None) -> int:
    """Ingest a single PDF file."""
    print(f"  Ingestion: {file_path}")
    print(f"  École: {school_id} | Matière: {matiere or 'N/A'} | Classe: {classe or 'N/A'} | Professeur: {professeur or 'N/A'} | Année: {annee_scolaire or 'N/A'}")
    
    chunks = ingest_pdf(file_path, school_id, matiere, classe, professeur, annee_scolaire)
    
    print(f"  ✓ {chunks} chunks ingérés")
    return chunks


def ingest_folder(folder_path: str, school_id: str, matiere: str = None, classe: str = None, professeur: str = None, annee_scolaire: str = None) -> int:
    """Ingest all PDF files in a folder."""
    folder = Path(folder_path)
    if not folder.exists():
        print(f"Erreur: Le dossier {folder_path} n'existe pas.")
        sys.exit(1)
    
    pdf_files = list(folder.glob("*.pdf")) + list(folder.glob("*.PDF"))
    if not pdf_files:
        print(f"Aucun fichier PDF trouvé dans {folder_path}")
        sys.exit(1)
    
    print(f"\n{len(pdf_files)} fichiers PDF trouvés dans {folder_path}\n")
    
    total_chunks = 0
    for pdf_file in sorted(pdf_files):
        try:
            chunks = ingest_single_file(str(pdf_file), school_id, matiere, classe, professeur, annee_scolaire)
            total_chunks += chunks
        except Exception as e:
            print(f"  ✗ Erreur lors de l'ingestion de {pdf_file}: {e}")
    
    return total_chunks


def main():
    parser = argparse.ArgumentParser(
        description="Ingestion de PDF dans le RAG Assistant Réussite",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples:
  # Ingest single file with all metadata
  python scripts/ingest.py --school upeps_01 --file math.pdf --matiere Maths --classe TS1 --professeur "M. Diallo" --annee-scolaire 2025-2026

  # Ingest all PDFs in a folder with shared metadata
  python scripts/ingest.py --school upeps_01 --folder ./fascicules/ --matiere Physique --classe TL2
        """
    )
    
    parser.add_argument("--school", required=True, help="school_id (ex: upeps_01)")
    parser.add_argument("--file", help="Chemin vers un fichier PDF")
    parser.add_argument("--folder", help="Chemin vers un dossier de PDFs")
    parser.add_argument("--matiere", help="Matière (Maths, PC, SVT, Philosophie, Français, HG, Anglais)")
    parser.add_argument("--classe", help="Classe (3e, TL1, TS2, TS1, TL2)")
    parser.add_argument("--professeur", help="Nom du professeur auteur du document")
    parser.add_argument("--annee-scolaire", help="Année scolaire (ex: 2025-2026)", default="2025-2026")
    
    args = parser.parse_args()
    
    if not args.file and not args.folder:
        print("Erreur: Spécifiez --file ou --folder")
        parser.print_help()
        sys.exit(1)
    
    # Verify .env exists
    env_path = Path(__file__).parent.parent / ".env"
    if not env_path.exists():
        print("Erreur: Fichier .env manquant. Copiez .env.example vers .env")
        sys.exit(1)
    
    print("=" * 60)
    print("  Assistant Réussite - Ingestion PDF")
    print("=" * 60)
    
    try:
        if args.file:
            total = ingest_single_file(args.file, args.school, args.matiere, args.classe, args.professeur, args.annee_scolaire)
        else:
            total = ingest_folder(args.folder, args.school, args.matiere, args.classe, args.professeur, args.annee_scolaire)
        
        print("\n" + "=" * 60)
        print(f"  ✓ Ingestion terminée: {total} chunks au total")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ Erreur: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
