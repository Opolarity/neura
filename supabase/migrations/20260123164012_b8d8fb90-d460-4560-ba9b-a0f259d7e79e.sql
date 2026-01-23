-- Delete duplicate records in product_stock keeping the one with highest ID
DELETE FROM product_stock ps1
WHERE EXISTS (
  SELECT 1 FROM product_stock ps2
  WHERE ps2.product_variation_id = ps1.product_variation_id
    AND ps2.warehouse_id = ps1.warehouse_id
    AND ps2.stock_type_id = ps1.stock_type_id
    AND ps2.id > ps1.id
);

-- Add UNIQUE constraint to prevent future duplicates
ALTER TABLE product_stock
ADD CONSTRAINT unique_variation_warehouse_stock_type 
UNIQUE (product_variation_id, warehouse_id, stock_type_id);