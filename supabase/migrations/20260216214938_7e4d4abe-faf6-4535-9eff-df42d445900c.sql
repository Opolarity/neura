
CREATE OR REPLACE FUNCTION public.get_pos_sessions_list(
  p_page integer DEFAULT 1,
  p_size integer DEFAULT 20,
  p_search text DEFAULT NULL,
  p_status_id bigint DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_total integer;
  v_offset integer;
  v_result jsonb;
BEGIN
  v_offset := (p_page - 1) * p_size;

  SELECT COUNT(*)
  INTO v_total
  FROM pos_sessions ps
  JOIN profiles pr ON pr."UID" = ps.user_id
  JOIN accounts a ON a.id = pr.account_id
  JOIN statuses s ON s.id = ps.status_id
  JOIN branches b ON b.id = ps.branch_id
  JOIN warehouses w ON w.id = ps.warehouse_id
  WHERE (p_status_id IS NULL OR ps.status_id = p_status_id)
    AND (p_search IS NULL OR 
         a.name ILIKE '%' || p_search || '%' OR
         a.last_name ILIKE '%' || p_search || '%' OR
         b.name ILIKE '%' || p_search || '%' OR
         w.name ILIKE '%' || p_search || '%');

  SELECT jsonb_build_object(
    'data', COALESCE(jsonb_agg(row_data ORDER BY opened_at DESC), '[]'::jsonb),
    'page', jsonb_build_object('p_page', p_page, 'p_size', p_size, 'total', v_total)
  )
  INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'id', ps.id,
      'user_id', ps.user_id,
      'user_name', CONCAT(a.name, ' ', COALESCE(a.last_name, '')),
      'branch_id', ps.branch_id,
      'branch_name', b.name,
      'warehouse_id', ps.warehouse_id,
      'warehouse_name', w.name,
      'opening_amount', ps.opening_amount,
      'closing_amount', ps."closing_amount number",
      'expected_amount', ps.expected_amount,
      'total_sales', ps.total_sales,
      'difference', ps.difference,
      'status_id', ps.status_id,
      'status_name', s.name,
      'status_code', s.code,
      'opened_at', ps.opened_at,
      'closed_at', ps.closed_at,
      'notes', ps.notes
    ) AS row_data,
    ps.opened_at
    FROM pos_sessions ps
    JOIN profiles pr ON pr."UID" = ps.user_id
    JOIN accounts a ON a.id = pr.account_id
    JOIN statuses s ON s.id = ps.status_id
    JOIN branches b ON b.id = ps.branch_id
    JOIN warehouses w ON w.id = ps.warehouse_id
    WHERE (p_status_id IS NULL OR ps.status_id = p_status_id)
      AND (p_search IS NULL OR 
           a.name ILIKE '%' || p_search || '%' OR
           a.last_name ILIKE '%' || p_search || '%' OR
           b.name ILIKE '%' || p_search || '%' OR
           w.name ILIKE '%' || p_search || '%')
    ORDER BY ps.opened_at DESC
    LIMIT p_size OFFSET v_offset
  ) sub;

  RETURN v_result;
END;
$fn$;
