-- Enable RLS on business_accounts if not already enabled
ALTER TABLE business_accounts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view business accounts
CREATE POLICY "Anyone can view business accounts"
ON business_accounts
FOR SELECT
USING (true);

-- Enable RLS on movement_categories if not already enabled
ALTER TABLE movement_categories ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view movement categories
CREATE POLICY "Anyone can view movement categories"
ON movement_categories
FOR SELECT
USING (true);

-- Enable RLS on movement_types if not already enabled
ALTER TABLE movement_types ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view movement types
CREATE POLICY "Anyone can view movement types"
ON movement_types
FOR SELECT
USING (true);

-- Enable RLS on movements table if not already enabled
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;

-- Create policies for movements table
CREATE POLICY "Authenticated users can view movements"
ON movements
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create movements"
ON movements
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);