-- Migration: Validation référentielle pour notifications_subscriptions.user_id
-- Une FK standard est impossible car user_id référence différentes tables selon role
-- Ce trigger valide que l'UUID existe dans la table correspondante

CREATE OR REPLACE FUNCTION validate_notification_user_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'student' THEN
        IF NOT EXISTS (SELECT 1 FROM students WHERE id::text = NEW.user_id) THEN
            RAISE EXCEPTION 'user_id % introuvable dans students pour le role student', NEW.user_id;
        END IF;
    ELSIF NEW.role = 'professor' THEN
        IF NOT EXISTS (SELECT 1 FROM professeurs WHERE id::text = NEW.user_id) THEN
            RAISE EXCEPTION 'user_id % introuvable dans professeurs pour le role professor', NEW.user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_notification_user_id ON notifications_subscriptions;
CREATE TRIGGER trg_validate_notification_user_id
    BEFORE INSERT OR UPDATE ON notifications_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION validate_notification_user_id();
