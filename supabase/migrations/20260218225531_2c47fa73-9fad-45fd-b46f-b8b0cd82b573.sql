
-- Deactivate the duplicate variation for product 106 (keep older ID 232, deactivate newer ID 250)
UPDATE variations SET is_active = false WHERE id = 250 AND is_active = true;
