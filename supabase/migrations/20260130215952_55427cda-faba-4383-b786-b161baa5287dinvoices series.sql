CREATE OR REPLACE FUNCTION sp_get_invoices_series(
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
              'invoice_type_id', q.invoice_type_id,
              'account_id', q.account_id,
              'next_number', q.next_number,
              'serie', q.serie,
              'name', q.name,
              'last_name', q.last_name
        )), '[]'::jsonb)
    ) INTO result
FROM (
  SELECT
    COUNT(*) OVER() AS total_rows,
    i.id,
    i.serie,
    i.invoice_type_id,
    i.account_id,
    i.next_number,
    a.name,
    a.last_name,
    CONCAT(a.name, ' ', a.last_name) AS name_client
  FROM
    invoice_series i
    JOIN accounts a ON i.account_id = a.id 
  WHERE
    (p_search IS NULL OR i.serie ILIKE '%' || p_search || '%' OR i.id::text ILIKE '%' || p_search || '%')
  ORDER BY
    i.id ASC
      LIMIT p_size
      OFFSET v_offset
   
) q;
    RETURN result;
END;
$$;