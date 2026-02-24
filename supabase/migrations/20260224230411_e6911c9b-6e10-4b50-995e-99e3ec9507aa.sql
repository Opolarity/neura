CREATE OR REPLACE FUNCTION public.sp_get_sales_list(
  p_page integer DEFAULT 1,
  p_size integer DEFAULT 20,
  p_search text DEFAULT NULL::text,
  p_status text DEFAULT NULL::text,
  p_sale_type integer DEFAULT NULL::integer,
  p_start_date date DEFAULT NULL::date,
  p_end_date date DEFAULT NULL::date,
  p_order text DEFAULT 'date_desc'::text,
  p_branch_id integer DEFAULT NULL::integer,
  p_warehouse_id integer DEFAULT NULL::integer
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
  v_offset INT := GREATEST((p_page - 1) * p_size, 0);
  v_search text := NULLIF(btrim(p_search), '');
  v_total INT;
BEGIN
  -- First, get the total count
  SELECT COUNT(*)
  INTO v_total
  FROM orders o
  LEFT JOIN order_situations os ON os.order_id = o.id AND os.last_row = true
  LEFT JOIN statuses sta ON sta.id = os.status_id
  WHERE 
    (v_search IS NULL OR 
      o.document_number ILIKE '%' || v_search || '%' OR
      o.customer_name ILIKE '%' || v_search || '%' OR
      COALESCE(o.customer_lastname, '') ILIKE '%' || v_search || '%')
    AND (p_status IS NULL OR sta.code = p_status)
    AND (p_sale_type IS NULL OR o.sale_type_id = p_sale_type)
    AND (p_start_date IS NULL OR o.date::date >= p_start_date)
    AND (p_end_date IS NULL OR o.date::date <= p_end_date)
    AND (p_branch_id IS NULL OR o.branch_id = p_branch_id)
    AND (p_warehouse_id IS NULL OR EXISTS (
      SELECT 1 FROM order_products op WHERE op.order_id = o.id AND op.warehouses_id = p_warehouse_id
    ));

  -- Build the result with pagination and data
  SELECT jsonb_build_object(
    'page', jsonb_build_object(
      'page', p_page,
      'size', p_size,
      'total', v_total
    ),
    'data', COALESCE(
      (SELECT jsonb_agg(row_order)
       FROM (
         SELECT jsonb_build_object(
           'id', o.id,
           'date', COALESCE(o.date, o.created_at),
           'document_number', o.document_number,
           'customer_name', o.customer_name,
           'customer_lastname', o.customer_lastname,
           'sale_type_name', st.name,
           'situation_name', sit.name,
           'status_code', sta.code,
           'total', o.total
         ) AS row_order
         FROM orders o
         LEFT JOIN types st ON st.id = o.sale_type_id
         LEFT JOIN order_situations os ON os.order_id = o.id AND os.last_row = true
         LEFT JOIN situations sit ON sit.id = os.situation_id
         LEFT JOIN statuses sta ON sta.id = os.status_id
         WHERE 
           (v_search IS NULL OR 
             o.document_number ILIKE '%' || v_search || '%' OR
             o.customer_name ILIKE '%' || v_search || '%' OR
             COALESCE(o.customer_lastname, '') ILIKE '%' || v_search || '%')
           AND (p_status IS NULL OR sta.code = p_status)
           AND (p_sale_type IS NULL OR o.sale_type_id = p_sale_type)
           AND (p_start_date IS NULL OR o.date::date >= p_start_date)
           AND (p_end_date IS NULL OR o.date::date <= p_end_date)
           AND (p_branch_id IS NULL OR o.branch_id = p_branch_id)
           AND (p_warehouse_id IS NULL OR EXISTS (
             SELECT 1 FROM order_products op WHERE op.order_id = o.id AND op.warehouses_id = p_warehouse_id
           ))
         ORDER BY 
           CASE WHEN p_order = 'date_desc' THEN COALESCE(o.date, o.created_at) END DESC,
           CASE WHEN p_order = 'date_asc' THEN COALESCE(o.date, o.created_at) END ASC,
           CASE WHEN p_order = 'total_desc' THEN o.total END DESC,
           CASE WHEN p_order = 'total_asc' THEN o.total END ASC,
           o.id DESC
         LIMIT p_size OFFSET v_offset
       ) sub
      ),
      '[]'::jsonb
    )
  ) INTO result;
  
  RETURN result;
END;
$function$;