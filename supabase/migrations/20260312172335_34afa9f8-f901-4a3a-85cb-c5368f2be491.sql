
-- Drop the old 9-argument overload to resolve PostgREST ambiguity
DROP FUNCTION IF EXISTS public.sp_create_order(uuid, bigint, bigint, jsonb, jsonb, jsonb, bigint, boolean, jsonb);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
