import argparse
import hashlib
import sys
from typing import List
import bcrypt
from config.database import get_supabase_client

logger = __import__('logging').getLogger(__name__)

def _is_sha256(hash_str: str) -> bool:
    """Detect a legacy SHA‑256 hash.
    SHA‑256 hashes are 64‑character hex strings without the ``$2b$`` prefix.
    """
    return len(hash_str) == 64 and all(c in "0123456789abcdef" for c in hash_str.lower())

def migrate_batch(limit: int = 100, dry_run: bool = True) -> List[str]:
    """Migrate up to *limit* student password hashes from SHA‑256 to bcrypt.
    Returns a list of student IDs that were updated (or would be updated in dry‑run).
    """
    supabase = get_supabase_client()
    # Fetch a batch of students – we only need id and password_hash columns
    result = supabase.table("students").select("id,password_hash").limit(limit).execute()
    if not result.data:
        logger.info("No students found for migration")
        return []

    updated_ids = []
    for row in result.data:
        student_id = row["id"]
        pwd_hash = row["password_hash"]
        if not _is_sha256(pwd_hash):
            continue  # already bcrypt or other format
        # Compute bcrypt hash of the original plaintext is impossible – we can only
        # re‑hash the *same* SHA‑256 value as if it were the password. This preserves
        # authentication because ``verify_password`` will now treat the stored value
        # as a bcrypt hash and compare the bcrypt of the incoming password (which is
        # still SHA‑256 of the plaintext) against it.
        # To keep legacy behaviour, we hash the *SHA‑256* string itself.
        bcrypt_hash = bcrypt.hashpw(pwd_hash.encode(), bcrypt.gensalt()).decode()
        if dry_run:
            logger.info(f"[dry‑run] Would update student {student_id} to bcrypt hash {bcrypt_hash[:20]}…")
        else:
            supabase.table("students").update({"password_hash": bcrypt_hash}).eq("id", student_id).execute()
            logger.info(f"Updated student {student_id} to bcrypt hash")
        updated_ids.append(student_id)
    return updated_ids

def main(argv: List[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Migrate legacy SHA‑256 student passwords to bcrypt.")
    parser.add_argument("--dry-run", action="store_true", default=False, help="Show what would be changed without writing to the DB.")
    parser.add_argument("--batch-size", type=int, default=100, help="Number of students to process per run.")
    args = parser.parse_args(argv)

    updated = migrate_batch(limit=args.batch_size, dry_run=args.dry_run)
    if args.dry_run:
        logger.info(f"Dry run complete – {len(updated)} records would be updated.")
    else:
        logger.info(f"Migration complete – {len(updated)} records updated.")

if __name__ == "__main__":
    main()
