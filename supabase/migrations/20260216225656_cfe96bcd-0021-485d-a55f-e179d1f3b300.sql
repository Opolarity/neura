
CREATE OR REPLACE FUNCTION public.get_pos_session_detail(p_session_id bigint)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'session', (
      SELECT json_build_object(
        'id', ps.id,
        'user_id', ps.user_id,
        'user_name', COALESCE(a.name || ' ' || COALESCE(a.last_name, ''), ''),
        'branch_id', ps.branch_id,
        'branch_name', b.name,
        'warehouse_id', ps.warehouse_id,
        'warehouse_name', w.name,
        'opening_amount', ps.opening_amount,
        'closing_amount', ps."closing_amount number",
        'expected_amount', ps.expected_amount,
        'total_sales', ps.total_sales,
        'difference', ps.difference,
        'opening_difference', ps.opening_difference,
        'status_id', ps.status_id,
        'status_name', st.name,
        'status_code', st.code,
        'opened_at', ps.opened_at,
        'closed_at', ps.closed_at,
        'notes', ps.notes
      )
      FROM pos_sessions ps
      JOIN profiles p ON p."UID" = ps.user_id
      JOIN accounts a ON a.id = p.account_id
      JOIN branches b ON b.id = ps.branch_id
      JOIN warehouses w ON w.id = ps.warehouse_id
      JOIN statuses st ON st.id = ps.status_id
      WHERE ps.id = p_session_id
    ),
    'orders', COALESCE((
      SELECT json_agg(
        json_build_object(
          'order_id', o.id,
          'customer_name', COALESCE(o.customer_name, '') || ' ' || COALESCE(o.customer_lastname, ''),
          'document_number', o.document_number,
          'total', o.total,
          'subtotal', o.subtotal,
          'discount', o.discount,
          'created_at', o.created_at
        ) ORDER BY o.created_at DESC
      )
      FROM pos_session_orders pso
      JOIN orders o ON o.id = pso.order_id
      WHERE pso.pos_session_id = p_session_id
    ), '[]'::json)
  ) INTO v_result;

  RETURN v_result;
END;
$$;
