CREATE OR REPLACE FUNCTION public.sp_get_stock_movements(
  p_page integer DEFAULT 1,
  p_size integer DEFAULT 20,
  p_search text DEFAULT NULL::text,
  p_origin integer DEFAULT NULL::integer,
  p_start_date date DEFAULT NULL::date,
  p_end_date date DEFAULT NULL::date,
  p_user integer DEFAULT NULL::integer,
  p_warehouse integer DEFAULT NULL::integer,
  p_in_out boolean DEFAULT NULL::boolean,
  p_order text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
  result JSONB;
  v_offset INT := GREATEST((p_page - 1) * p_size, 0);
BEGIN
  SELECT jsonb_build_object(
    'page',
    jsonb_build_object(
      'page', p_page,
      'size', p_size,
      'total', COALESCE(MAX(ca.total_rows), 0)
    ),
    'data', COALESCE(
      jsonb_agg(jsonb_build_object(
        'movements_id', ca.id,
        'date', ca.fecha,
        'product', ca.nombre,
        'variation', ca.termino,
        'quantity', ca.cantidad,
        'warehouse', ca.almacen,
        'vinc_id', ca.vinculated_id,
        'vinc_warehouse', ca.vinculated,
        'vinc_stock_type', ca.vinc_movimiento_stock,
        'movement_type', ca.origen,
        'stock_type', ca.movimiento_stock,
        'user', ca.usuario
      )),
      '[]'::jsonb
    )
  )
  INTO result
  FROM (
    SELECT
      i.total_rows,
      i.id,
      i.fecha,
      i.cantidad,
      i.usuario,
      i.movimiento_stock,
      i.origen,
      i.almacen,
      k.vinculated,
      k.vinc_movimiento_stock,
      k.vinculated_id,
      i.nombre,
      i.termino
    FROM (
      SELECT
        COUNT(*) OVER() AS total_rows,
        sm.id,
        sm.created_at::DATE AS fecha,
        sm.quantity AS cantidad,
        c.name AS usuario,
        t.name AS movimiento_stock,
        mt.name AS origen,
        w.name AS almacen,
        sm.vinculated_movement_id,
        p.title AS nombre,
        COALESCE(STRING_AGG(ter.name, '-' ORDER BY tg.id), 'sin variación') AS termino
      FROM stock_movements sm
      JOIN profiles prof ON prof."UID" = sm.created_by
      JOIN accounts c ON c.id = prof.account_id
        AND (p_user IS NULL OR p_user = c.id)
      JOIN types t ON t.id = sm.stock_type_id
      JOIN types mt ON mt.id = sm.movement_type
        AND (p_origin IS NULL OR p_origin = mt.id)
      JOIN warehouses w ON w.id = sm.warehouse_id
        AND (p_warehouse IS NULL OR p_warehouse = w.id)
      JOIN variations vr ON vr.id = sm.product_variation_id
      JOIN products p ON p.id = vr.product_id
      LEFT JOIN variation_terms vt ON vt.product_variation_id = vr.id
      LEFT JOIN terms ter ON ter.id = vt.term_id
      LEFT JOIN term_groups tg ON tg.id = ter.term_group_id
      WHERE
        (sm.is_active = true)
        AND (
          (p_start_date IS NULL AND p_end_date IS NULL)
          OR (p_start_date IS NOT NULL AND p_end_date IS NULL AND sm.created_at::DATE >= p_start_date)
          OR (p_start_date IS NULL AND p_end_date IS NOT NULL AND sm.created_at::DATE <= p_end_date)
          OR (p_start_date IS NOT NULL AND p_end_date IS NOT NULL AND sm.created_at::DATE BETWEEN p_start_date AND p_end_date)
        )
        AND (
          (p_in_out IS NULL)
          OR (p_in_out = TRUE AND sm.quantity > 0)
          OR (p_in_out = FALSE AND sm.quantity < 0)
        )
        AND (p_search IS NULL OR p.title ILIKE '%' || p_search || '%')
      GROUP BY
        sm.id,
        sm.created_at,
        sm.quantity,
        c.name,
        t.name,
        mt.name,
        w.name,
        sm.vinculated_movement_id,
        p.title
    ) AS i
    LEFT JOIN (
      SELECT
        sm.id,
        wm.name AS vinculated,
        smp.id AS vinculated_id,
        tp.name AS vinc_movimiento_stock
      FROM stock_movements sm
      JOIN stock_movements smp ON sm.vinculated_movement_id = smp.id
      JOIN warehouses wm ON wm.id = smp.warehouse_id
      JOIN types tp ON tp.id = smp.stock_type_id
    ) AS k ON k.id = i.id
    ORDER BY
      CASE WHEN p_order = 'date-asc' THEN i.fecha END ASC,
      CASE WHEN p_order = 'date-dsc' THEN i.fecha END DESC,
      CASE WHEN p_order = 'alp-asc' THEN i.nombre END ASC,
      CASE WHEN p_order = 'alp-dsc' THEN i.nombre END DESC,
      CASE WHEN p_order = 'cant-asc' THEN i.cantidad END ASC,
      CASE WHEN p_order = 'cant-dsc' THEN i.cantidad END DESC,
      CASE WHEN p_order = 'id-asc' THEN i.id END ASC,
      CASE WHEN p_order IN ('id-dsc', 'desc') THEN i.id END DESC,
      i.id DESC
    LIMIT p_size
    OFFSET v_offset
  ) ca;

  RETURN result;
END;
$function$;