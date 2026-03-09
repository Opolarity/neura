-- Drop old sp_create_product overload (without promotional params)
DROP FUNCTION public.sp_create_product(text, text, text, boolean, boolean, boolean, integer[], jsonb, jsonb, uuid);