"""
Pytest conftest — sets env vars needed by settings module.
Heavy module mocking (rag.engine, database) is done in each test file as needed.
"""
import os
os.environ.setdefault('SUPABASE_URL', 'https://test.supabase.co')
os.environ.setdefault('SUPABASE_SERVICE_KEY', 'test-key')
os.environ.setdefault('DATABASE_URL', 'postgresql://test:test@localhost/test')
os.environ.setdefault('GROQ_API_KEY', 'gsk-test')
os.environ.setdefault('SUPER_ADMIN_KEY', 'test-super-admin-key')
os.environ.setdefault('LEGACY_HASH_FOR_TESTS', 'True')
os.environ.setdefault('VAPID_PUBLIC_KEY', '04ea1d4e680f7d80c69165ed3b522885c9760c2ca83e9ae2fecea592f3cc290e565cedcd8b629ebdf02667010a6d7fd1e5bb2523791feda83cc021676f704e34de')
os.environ.setdefault('VAPID_PRIVATE_KEY', '308187020100301306072a8648ce3d020106082a8648ce3d030107046d306b02010104202cd418b99aabfe6798775cc345feff5eee58107408a034977f3724c8d933a7e6a14403420004ea1d4e680f7d80c69165ed3b522885c9760c2ca83e9ae2fecea592f3cc290e565cedcd8b629ebdf02667010a6d7fd1e5bb2523791feda83cc021676f704e34de')
