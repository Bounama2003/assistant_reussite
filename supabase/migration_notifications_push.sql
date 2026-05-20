-- Migration: notifications_subscriptions (Web Push subscriptions)
-- Stocke les abonnements push pour chaque utilisateur

CREATE TABLE IF NOT EXISTS notifications_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'professor', 'admin', 'superadmin')),
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_notif_sub_user_role ON notifications_subscriptions(user_id, role);
CREATE INDEX IF NOT EXISTS idx_notif_sub_role ON notifications_subscriptions(role);

ALTER TABLE notifications_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_sub_backend_access" ON notifications_subscriptions FOR ALL USING (true);
