DROP FUNCTION public.sp_get_terms(p_page integer, p_size integer, p_search text, p_min_pr integer, p_max_pr integer, p_group integer, p_order text);
NOTIFY pgrst, 'reload schema';