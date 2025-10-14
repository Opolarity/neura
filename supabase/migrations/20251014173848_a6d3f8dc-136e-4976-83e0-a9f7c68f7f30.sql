-- Disable RLS for location tables (public geographical data)
ALTER TABLE public.countries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.states DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhoods DISABLE ROW LEVEL SECURITY;