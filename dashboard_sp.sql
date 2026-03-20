CREATE OR REPLACE FUNCTION sp_get_dashboard()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ventas_mes numeric;
  v_productos_stock numeric;
  v_ordenes_pendientes integer;
  v_clientes_activos integer;
  v_ventas_recientes json;
  v_productos_bajos json;
  v_result json;
BEGIN
  -- Ventas del mes (suma del total de orders creadas este mes)
  SELECT COALESCE(SUM(total), 0) INTO v_ventas_mes
  FROM orders
  WHERE date_trunc('month', created_at) = date_trunc('month', current_date);

  -- Productos en stock (suma de stock en variations)
  SELECT COALESCE(SUM(stock), 0) INTO v_productos_stock
  FROM variations;

  -- Órdenes pendientes (orders donde el estado más reciente NO es COM o CAN)
  SELECT COUNT(*) INTO v_ordenes_pendientes
  FROM order_situations os
  JOIN statuses s ON s.id = os.status_id
  WHERE os.last_row = true AND s.code NOT IN ('COM', 'CAN', 'ENT');

  -- Clientes activos (clientes unicos en orders este mes)
  SELECT COUNT(DISTINCT document_number) INTO v_clientes_activos
  FROM orders
  WHERE document_number IS NOT NULL AND document_number != ''
    AND date_trunc('month', created_at) = date_trunc('month', current_date);

  -- Ventas Recientes
  SELECT json_agg(row_to_json(t)) INTO v_ventas_recientes
  FROM (
    SELECT 
      id, 
      TRIM(COALESCE(customer_name, '') || ' ' || COALESCE(customer_lastname, '')) as customer,
      total as amount,
      created_at as time
    FROM orders
    ORDER BY created_at DESC
    LIMIT 5
  ) t;

  -- Productos con stock bajo
  SELECT json_agg(row_to_json(p)) INTO v_productos_bajos
  FROM (
    SELECT 
      pr.title as name,
      pv.stock,
      10 as min
    FROM variations pv
    JOIN products pr ON pr.id = pv.product_id
    WHERE pv.stock < 10 AND pv.stock >= 0
    ORDER BY pv.stock ASC
    LIMIT 5
  ) p;

  v_result := json_build_object(
    'ventas_del_mes', v_ventas_mes,
    'productos_stock', v_productos_stock,
    'ordenes_pendientes', v_ordenes_pendientes,
    'clientes_activos', v_clientes_activos,
    'ventas_recientes', COALESCE(v_ventas_recientes, '[]'::json),
    'productos_stock_bajo', COALESCE(v_productos_bajos, '[]'::json)
  );

  RETURN v_result;
END;
$$;
