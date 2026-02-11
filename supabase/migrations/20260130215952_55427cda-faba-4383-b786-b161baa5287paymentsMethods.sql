CREATE OR REPLACE FUNCTION sp_get_payments_methods(
       p_search TEXT DEFAULT NULL,
       p_page INTEGER DEFAULT 1,
       p_size INTEGER DEFAULT 20
)
RETURNS JSONB
language plpgsql
AS $$
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
              'business_account_id', q.business_account_id,
              'name', q.name,
              'active', q.active
        )), '[]'::jsonb)
    ) INTO result
FROM (
  SELECT
    COUNT(*) OVER() AS total_rows,
    p.id,
    p.business_account_id,
    b.name,
    p.active
  FROM
    payment_methods p 
    JOIN business_accounts b ON p.business_account_id = b.id

  WHERE
    (p_search IS NULL OR p.name ILIKE '%' || p_search || '%' OR p.id::text ILIKE '%' || p_search || '%')
  ORDER BY
    p.id ASC
      LIMIT p_size
      OFFSET v_offset
   
) q;
    RETURN result;
END;
$$;