-- Stored procedure para listar clientes con filtros, orden y paginación
CREATE OR REPLACE FUNCTION public.get_clients_list(
  p_search text DEFAULT NULL,
  p_min_purchases integer DEFAULT NULL,
  p_max_purchases integer DEFAULT NULL,
  p_min_amount numeric DEFAULT NULL,
  p_max_amount numeric DEFAULT NULL,
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL,
  p_order text DEFAULT 'date-desc',
  p_page integer DEFAULT 1,
  p_size integer DEFAULT 20
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
  result JSONB;
  v_offset int := GREATEST((p_page - 1) * p_size, 0);
  v_search text := NULLIF(btrim(p_search), '');
BEGIN
  SELECT jsonb_build_object(
    'page', jsonb_build_object(
      'page', p_page,
      'size', p_size,
      'total', COALESCE(MAX(q.total_rows), 0)
    ),
    'data', COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', q.id,
        'name', q.name,
        'middle_name', q.middle_name,
        'last_name', q.last_name,
        'last_name2', q.last_name2,
        'document_number', q.document_number,
        'created_at', q.created_at,
        'purchase_count', q.purchase_count,
        'total_amount', q.total_amount
      )
    ), '[]'::jsonb)
  )
  INTO result
  FROM (
    SELECT
      COUNT(*) OVER () AS total_rows,
      c.id,
      c.name,
      c.middle_name,
      c.last_name,
      c.last_name2,
      c.document_number,
      c.created_at,
      COALESCE(stats.purchase_count, 0) AS purchase_count,
      COALESCE(stats.total_amount, 0) AS total_amount
    FROM clients c
    LEFT JOIN (
      SELECT 
        o.document_number,
        o.document_type,
        COUNT(*) AS purchase_count,
        SUM(o.total) AS total_amount
      FROM orders o
      GROUP BY o.document_number, o.document_type
    ) stats ON stats.document_number = c.document_number 
           AND stats.document_type = c.document_type_id
    WHERE
      -- Filtro de búsqueda por nombre o documento
      (v_search IS NULL OR 
        CONCAT(c.name, ' ', COALESCE(c.middle_name, ''), ' ', c.last_name, ' ', COALESCE(c.last_name2, '')) ILIKE '%' || v_search || '%'
        OR c.document_number ILIKE '%' || v_search || '%'
      )
      -- Filtro por cantidad de compras
      AND (
        (p_min_purchases IS NULL AND p_max_purchases IS NULL)
        OR (p_min_purchases IS NOT NULL AND p_max_purchases IS NULL AND COALESCE(stats.purchase_count, 0) >= p_min_purchases)
        OR (p_min_purchases IS NULL AND p_max_purchases IS NOT NULL AND COALESCE(stats.purchase_count, 0) <= p_max_purchases)
        OR (p_min_purchases IS NOT NULL AND p_max_purchases IS NOT NULL AND COALESCE(stats.purchase_count, 0) BETWEEN p_min_purchases AND p_max_purchases)
      )
      -- Filtro por monto gastado
      AND (
        (p_min_amount IS NULL AND p_max_amount IS NULL)
        OR (p_min_amount IS NOT NULL AND p_max_amount IS NULL AND COALESCE(stats.total_amount, 0) >= p_min_amount)
        OR (p_min_amount IS NULL AND p_max_amount IS NOT NULL AND COALESCE(stats.total_amount, 0) <= p_max_amount)
        OR (p_min_amount IS NOT NULL AND p_max_amount IS NOT NULL AND COALESCE(stats.total_amount, 0) BETWEEN p_min_amount AND p_max_amount)
      )
      -- Filtro por rango de fecha
      AND (p_date_from IS NULL OR c.created_at::date >= p_date_from)
      AND (p_date_to IS NULL OR c.created_at::date <= p_date_to)
    ORDER BY
      CASE WHEN p_order = 'date-asc' THEN c.created_at END ASC,
      CASE WHEN p_order = 'date-desc' THEN c.created_at END DESC,
      CASE WHEN p_order = 'amount-asc' THEN COALESCE(stats.total_amount, 0) END ASC,
      CASE WHEN p_order = 'amount-desc' THEN COALESCE(stats.total_amount, 0) END DESC,
      CASE WHEN p_order = 'purchases-asc' THEN COALESCE(stats.purchase_count, 0) END ASC,
      CASE WHEN p_order = 'purchases-desc' THEN COALESCE(stats.purchase_count, 0) END DESC,
      c.id ASC
    LIMIT p_size
    OFFSET v_offset
  ) q;

  RETURN result;
END;
$function$;