-- Enable RLS on products table if not already enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can insert products" ON products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON products;
DROP POLICY IF EXISTS "Authenticated users can select products" ON products;

-- Create new policies for products
CREATE POLICY "Authenticated users can insert products"
ON products
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
ON products
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can select products"
ON products
FOR SELECT
TO authenticated
USING (true);

-- Enable RLS on product_categories table
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can insert product_categories" ON product_categories;
DROP POLICY IF EXISTS "Authenticated users can delete product_categories" ON product_categories;

-- Create policies for product_categories
CREATE POLICY "Authenticated users can insert product_categories"
ON product_categories
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete product_categories"
ON product_categories
FOR DELETE
TO authenticated
USING (true);

-- Enable RLS on product_images table
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can insert product_images" ON product_images;
DROP POLICY IF EXISTS "Authenticated users can delete product_images" ON product_images;
DROP POLICY IF EXISTS "Authenticated users can select product_images" ON product_images;

-- Create policies for product_images
CREATE POLICY "Authenticated users can insert product_images"
ON product_images
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete product_images"
ON product_images
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can select product_images"
ON product_images
FOR SELECT
TO authenticated
USING (true);

-- Enable RLS on variations table
ALTER TABLE variations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can insert variations" ON variations;
DROP POLICY IF EXISTS "Authenticated users can update variations" ON variations;
DROP POLICY IF EXISTS "Authenticated users can select variations" ON variations;

-- Create policies for variations
CREATE POLICY "Authenticated users can insert variations"
ON variations
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update variations"
ON variations
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can select variations"
ON variations
FOR SELECT
TO authenticated
USING (true);

-- Enable RLS on variation_terms table
ALTER TABLE variation_terms ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can insert variation_terms" ON variation_terms;
DROP POLICY IF EXISTS "Authenticated users can delete variation_terms" ON variation_terms;

-- Create policies for variation_terms
CREATE POLICY "Authenticated users can insert variation_terms"
ON variation_terms
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete variation_terms"
ON variation_terms
FOR DELETE
TO authenticated
USING (true);

-- Enable RLS on product_price table
ALTER TABLE product_price ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can insert product_price" ON product_price;
DROP POLICY IF EXISTS "Authenticated users can update product_price" ON product_price;
DROP POLICY IF EXISTS "Authenticated users can select product_price" ON product_price;

-- Create policies for product_price
CREATE POLICY "Authenticated users can insert product_price"
ON product_price
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update product_price"
ON product_price
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can select product_price"
ON product_price
FOR SELECT
TO authenticated
USING (true);

-- Enable RLS on product_stock table
ALTER TABLE product_stock ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can insert product_stock" ON product_stock;
DROP POLICY IF EXISTS "Authenticated users can update product_stock" ON product_stock;
DROP POLICY IF EXISTS "Authenticated users can select product_stock" ON product_stock;

-- Create policies for product_stock
CREATE POLICY "Authenticated users can insert product_stock"
ON product_stock
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update product_stock"
ON product_stock
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can select product_stock"
ON product_stock
FOR SELECT
TO authenticated
USING (true);

-- Enable RLS on product_variation_images table
ALTER TABLE product_variation_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can insert product_variation_images" ON product_variation_images;
DROP POLICY IF EXISTS "Authenticated users can delete product_variation_images" ON product_variation_images;

-- Create policies for product_variation_images
CREATE POLICY "Authenticated users can insert product_variation_images"
ON product_variation_images
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete product_variation_images"
ON product_variation_images
FOR DELETE
TO authenticated
USING (true);