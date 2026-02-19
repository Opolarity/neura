-- Fix order 67 product price (variation 185 has price 20 in price list Minorista)
UPDATE order_products 
SET product_price = 20 
WHERE order_id = 67 AND product_variation_id = 185;

-- Also fix the order totals
UPDATE orders 
SET subtotal = 20, total = 20, discount = 0 
WHERE id = 67;