-- Enable Row Level Security on notes table
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own notes
CREATE POLICY "Users can view their own notes"
ON public.notes
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to create their own notes
CREATE POLICY "Users can create their own notes"
ON public.notes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own notes
CREATE POLICY "Users can update their own notes"
ON public.notes
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow users to delete their own notes
CREATE POLICY "Users can delete their own notes"
ON public.notes
FOR DELETE
USING (auth.uid() = user_id);

-- Enable Row Level Security on oder_notes table
ALTER TABLE public.oder_notes ENABLE ROW LEVEL SECURITY;

-- Allow users to create note links for their orders
CREATE POLICY "Users can create note links for their orders"
ON public.oder_notes
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.orders
  WHERE orders.id = oder_notes.order_id
  AND orders.user_id = auth.uid()
));

-- Allow users to view note links for their orders
CREATE POLICY "Users can view note links for their orders"
ON public.oder_notes
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.orders
  WHERE orders.id = oder_notes.order_id
  AND orders.user_id = auth.uid()
));