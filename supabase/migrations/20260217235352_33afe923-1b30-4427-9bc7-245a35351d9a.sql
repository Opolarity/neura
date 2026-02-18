-- Restore last_row=true for order 67's situation (it was set to false before the failed insert)
UPDATE order_situations 
SET last_row = true 
WHERE order_id = 67 AND id = 100;
