-- Drop all overloads first, then recreate
DROP FUNCTION IF EXISTS public.sp_get_payments_methods(integer, integer, text);
DROP FUNCTION IF EXISTS public.sp_get_payments_methods(text, integer, integer);

CREATE OR REPLACE FUNCTION public.sp_get_payments_methods(
  p_page integer DEFAULT 1,
  p_size integer DEFAULT 20,
  p_search text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
  v_offset INT := GREATEST((p_page - 1) * p_size, 0);
BEGIN
  SELECT jsonb_build_object(
    'page', jsonb_build_object(
            'page', p_page,
            'size', p_size,
            'total', COALESCE(MAX(q.total_rows), 0)
        ),
        'data', COALESCE(jsonb_agg(jsonb_build_object(
              'id', q.id,
              'business_account_id', q.business_name,
              'name', q.name,
              'active', q.active
        )), '[]'::jsonb)
    ) INTO result
FROM (
  SELECT
    COUNT(*) OVER() AS total_rows,
    p.id,
    b.name AS business_name,
    p.name,
    p.active
  FROM
    payment_methods p 
    JOIN business_accounts b ON p.business_account_id = b.id
  WHERE
    p.is_active = true
    AND (p_search IS NULL OR p.name ILIKE '%' || p_search || '%' OR p.id::text ILIKE '%' || p_search || '%')
  ORDER BY
    p.id ASC
  LIMIT p_size
  OFFSET v_offset
) q;
    RETURN result;
END;
$function$;