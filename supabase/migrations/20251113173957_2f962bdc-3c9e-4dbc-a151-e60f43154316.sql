-- Update the icon for movements function to use ArrowUpDown
UPDATE functions 
SET icon = 'ArrowUpDown' 
WHERE code = 'movements' OR name ILIKE '%movimiento%';