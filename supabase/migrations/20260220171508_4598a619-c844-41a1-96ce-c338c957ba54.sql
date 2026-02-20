
CREATE OR REPLACE FUNCTION public.get_pos_sessions_list(
  p_page INT DEFAULT 1,
  p_size INT DEFAULT 20,
  p_search TEXT DEFAULT NULL,
  p_status_id INT DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_difference_type TEXT DEFAULT NULL,
  p_sales_min NUMERIC DEFAULT NULL,
  p_sales_max NUMERIC DEFAULT NULL,
  p_order_by TEXT DEFAULT 'date-desc'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offset INT;
  v_total BIGINT;
  v_results JSON;
BEGIN
  v_offset := (p_page - 1) * p_size;

  -- Count total
  SELECT COUNT(*) INTO v_total
  FROM pos_sessions ps
  JOIN branches b ON b.id = ps.branch_id
  JOIN profiles pr ON pr."UID" = ps.user_id
  JOIN accounts a ON a.id = pr.account_id
  WHERE
    (p_status_id IS NULL OR ps.status_id = p_status_id)
    AND (p_search IS NULL OR (
      a.name ILIKE '%' || p_search || '%'
      OR a.last_name ILIKE '%' || p_search || '%'
      OR b.name ILIKE '%' || p_search || '%'
    ))
    AND (p_date_from IS NULL OR ps.opened_at >= p_date_from)
    AND (p_date_to IS NULL OR (
      (ps.closed_at IS NOT NULL AND ps.closed_at <= p_date_to)
      OR (ps.closed_at IS NULL AND ps.opened_at <= p_date_to)
    ))
    AND (p_difference_type IS NULL OR p_difference_type = '' OR
      CASE p_difference_type
        WHEN 'none' THEN (ps.opening_difference = 0 AND (ps.difference IS NULL OR ps.difference = 0))
        WHEN 'opening' THEN (ps.opening_difference != 0)
        WHEN 'closing' THEN (ps.difference IS NOT NULL AND ps.difference != 0)
        ELSE true
      END
    )
    AND (p_sales_min IS NULL OR COALESCE(ps.total_sales, 0) >= p_sales_min)
    AND (p_sales_max IS NULL OR COALESCE(ps.total_sales, 0) <= p_sales_max);

  -- Get paginated results with dynamic ordering
  SELECT json_agg(row_data) INTO v_results
  FROM (
    SELECT
      ps.id,
      ps.user_id,
      ps.warehouse_id,
      ps.branch_id,
      b.name AS branch_name,
      ps.business_account AS business_account_id,
      ps.opening_amount,
      ps."closing_amount number" AS closing_amount,
      ps.expected_amount,
      ps.difference,
      ps.opening_difference,
      ps.total_sales,
      ps.status_id,
      ps.opened_at,
      ps.closed_at,
      ps.notes,
      a.name AS user_name,
      a.last_name AS user_last_name
    FROM pos_sessions ps
    JOIN branches b ON b.id = ps.branch_id
    JOIN profiles pr ON pr."UID" = ps.user_id
    JOIN accounts a ON a.id = pr.account_id
    WHERE
      (p_status_id IS NULL OR ps.status_id = p_status_id)
      AND (p_search IS NULL OR (
        a.name ILIKE '%' || p_search || '%'
        OR a.last_name ILIKE '%' || p_search || '%'
        OR b.name ILIKE '%' || p_search || '%'
      ))
      AND (p_date_from IS NULL OR ps.opened_at >= p_date_from)
      AND (p_date_to IS NULL OR (
        (ps.closed_at IS NOT NULL AND ps.closed_at <= p_date_to)
        OR (ps.closed_at IS NULL AND ps.opened_at <= p_date_to)
      ))
      AND (p_difference_type IS NULL OR p_difference_type = '' OR
        CASE p_difference_type
          WHEN 'none' THEN (ps.opening_difference = 0 AND (ps.difference IS NULL OR ps.difference = 0))
          WHEN 'opening' THEN (ps.opening_difference != 0)
          WHEN 'closing' THEN (ps.difference IS NOT NULL AND ps.difference != 0)
          ELSE true
        END
      )
      AND (p_sales_min IS NULL OR COALESCE(ps.total_sales, 0) >= p_sales_min)
      AND (p_sales_max IS NULL OR COALESCE(ps.total_sales, 0) <= p_sales_max)
    ORDER BY
      CASE WHEN p_order_by = 'date-desc' THEN ps.opened_at END DESC NULLS LAST,
      CASE WHEN p_order_by = 'date-asc' THEN ps.opened_at END ASC NULLS LAST,
      CASE WHEN p_order_by = 'sales-desc' THEN COALESCE(ps.total_sales, 0) END DESC NULLS LAST,
      CASE WHEN p_order_by = 'sales-asc' THEN COALESCE(ps.total_sales, 0) END ASC NULLS LAST,
      CASE WHEN p_order_by = 'opening-diff-desc' THEN
        CASE WHEN ps.opening_difference = 0 THEN NULL ELSE ABS(ps.opening_difference) END
      END DESC NULLS LAST,
      CASE WHEN p_order_by = 'opening-diff-asc' THEN
        CASE WHEN ps.opening_difference = 0 THEN NULL ELSE ABS(ps.opening_difference) END
      END ASC NULLS LAST,
      CASE WHEN p_order_by = 'closing-diff-desc' THEN
        CASE WHEN ps.difference IS NULL OR ps.difference = 0 THEN NULL ELSE ABS(ps.difference) END
      END DESC NULLS LAST,
      CASE WHEN p_order_by = 'closing-diff-asc' THEN
        CASE WHEN ps.difference IS NULL OR ps.difference = 0 THEN NULL ELSE ABS(ps.difference) END
      END ASC NULLS LAST
    LIMIT p_size
    OFFSET v_offset
  ) AS row_data;

  RETURN json_build_object(
    'data', COALESCE(v_results, '[]'::json),
    'total', v_total,
    'page', p_page,
    'size', p_size
  );
END;
$$;
