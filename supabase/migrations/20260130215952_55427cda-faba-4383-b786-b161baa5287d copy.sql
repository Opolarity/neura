CREATE OR REPLACE FUNCTION sp_get_invoices( 
       p_search TEXT DEFAULT NULL,
       p_type INTEGER DEFAULT NULL,
       p_declared BOOLEAN DEFAULT NULL,
       p_min_mount NUMERIC DEFAULT NULL,
       p_max_mount NUMERIC DEFAULT NULL,
       p_order TEXT DEFAULT NULL,
       p_page INTEGER DEFAULT 1,
       p_size INTEGER DEFAULT 20
)
RETURN JSONB
LANGUAGE plpgsql
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
              'serie', q.serie,
              'total_amount', q.total_amount,
              'declared', q.declared,
              'name', q.name
        )), '[]'::jsonb)
    ) INTO result
FROM (
  SELECT 
    COUNT(*) OVER () AS total_rows,
    i.id, 
    i.serie, 
    i.total_amount, 
    i.declared, 
    t.name 
  FROM 
    invoices i JOIN types t 
  ON 
    i.invoice_type_id = t.id AND (p_type IS NULL OR p_type = t.id);
  WHERE 
   (p_declared IS NULL OR p_declared = i.declared) AND ((p_min_mount IS NULL OR p_max_mount IS NULL) OR (p_min_mount IS NOT NULL AND p_max_mount IS NULL AND COALESCE(i.total_amount , 0)  >= p_min_mount ) OR (p_min_mount IS NULL AND p_max_mount IS NOT NULL AND COALESCE(i.total_amount , 0)<= p_max_mount) OR (p_min_mount IS NOT NULL AND p_max_mount IS NOT NULL AND COALESCE(i.total_amount, 0) BETWEEN p_min_mount AND p_max_mount)) AND (p_search IS NULL OR (i.serie ILIKE '%' || p_search|| '%') OR (i.id ILIKE '%' || p_search || '%')) AND (
    ORDER BY 
      CASE WHEN p_order = "date-asc" THEN i.created_at END ASC;
      CASE WHEN p_order = "date-desc" THEN i.created_at END DESC;
      CASE WHEN p_order = "price-asc" THEN i.total_amount END ASC;
      CASE WHEN p_order = "price-desc" THEN i.total_amount END DESC;

      LIMIT p_size 
      OFFSET v_offset
   )
) q;
    RETURN result;
END;
$$;
 
select sp_get_invoices()