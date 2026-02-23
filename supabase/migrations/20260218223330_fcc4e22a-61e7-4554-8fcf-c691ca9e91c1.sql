
UPDATE variations
SET is_active = false
WHERE id IN (245, 248, 247, 249, 246, 244, 243, 242)
  AND is_active = true;
