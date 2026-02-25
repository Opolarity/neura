DROP FUNCTION IF EXISTS public.sp_get_shipping_methods(
  p_countries numeric,
  p_states numeric,
  p_cities numeric,
  p_neighborhoods numeric,
  p_min_cost numeric,
  p_max_cost numeric,
  p_search text,
  p_page numeric,
  p_size numeric,
  p_order text
);