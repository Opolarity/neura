-- Drop the old overload without p_situation_id
DROP FUNCTION IF EXISTS public.sp_get_sales_list(integer, integer, text, text, integer, date, date, text, integer, integer);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';