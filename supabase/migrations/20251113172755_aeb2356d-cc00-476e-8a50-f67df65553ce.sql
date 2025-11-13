-- Drop existing policies if they exist to recreate them
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can view movement categories" ON movement_categories;
    DROP POLICY IF EXISTS "Anyone can view movement types" ON movement_types;
    DROP POLICY IF EXISTS "Authenticated users can view movements" ON movements;
    DROP POLICY IF EXISTS "Authenticated users can create movements" ON movements;
END $$;

-- Create policy to allow anyone to view movement categories
CREATE POLICY "Anyone can view movement categories"
ON movement_categories
FOR SELECT
USING (true);

-- Create policy to allow anyone to view movement types
CREATE POLICY "Anyone can view movement types"
ON movement_types
FOR SELECT
USING (true);

-- Create policies for movements table
CREATE POLICY "Authenticated users can view movements"
ON movements
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create movements"
ON movements
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);