-- Remove redundant policy that allows viewing all stock movements
DROP POLICY IF EXISTS "Authenticated users can view stock movements" ON stock_movements;

-- The policy "Authenticated users can view their own stock movements" is sufficient
-- as it restricts users to only see movements they created