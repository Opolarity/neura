-- Add RLS policies for stock_movements table
CREATE POLICY "Authenticated users can create stock movements"
ON stock_movements
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can view stock movements"
ON stock_movements
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view their own stock movements"
ON stock_movements
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);