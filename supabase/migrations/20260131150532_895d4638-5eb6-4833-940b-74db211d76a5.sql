
CREATE OR REPLACE FUNCTION public.sp_get_inventory(p_search text DEFAULT NULL::text, p_page integer DEFAULT 1, p_size integer DEFAULT 20, p_warehouse integer DEFAULT NULL::integer, p_types integer DEFAULT 9, p_order text DEFAULT NULL::text, p_min_stock integer DEFAULT NULL::integer, p_max_stock integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$DECLARE
  result jsonb;
  v_offset int := GREATEST((p_page - 1) * p_size, 0);
  v_type_id int;
BEGIN

  IF p_types IS NOT NULL THEN
    v_type_id := p_types;
  ELSE
    SELECT t.id INTO v_type_id
    FROM types t
    JOIN modules m ON m.id = t.module_id
    WHERE m.code = 'STM' 
      AND t.code = 'PRD'
    LIMIT 1;
  END IF;

  WITH wh AS (
    SELECT w.id AS warehouse_id, w.name AS warehouse_name
    FROM warehouses w
    WHERE (p_warehouse IS NULL OR w.id = p_warehouse) AND (w.is_active=TRUE)
    ORDER BY w.id
  ),

  base AS (
    SELECT
      v.id AS variation_id,
      v.sku,
      p.title AS product_name,
      COALESCE(t.name, 'sin variación') AS variation_name
    FROM variations v
    JOIN products p ON p.id = v.product_id
    LEFT JOIN variation_terms vt ON vt.product_variation_id = v.id
    LEFT JOIN terms t ON t.id = vt.term_id
    WHERE
      v.is_active = true
      AND p.is_active = true
      AND (p_search IS NULL
        OR p.title ILIKE '%' || p_search || '%'
        OR v.sku   ILIKE '%' || p_search || '%')
  ),

  base_with_stock AS (
    SELECT
      b.*,
      COALESCE(SUM(ps.stock) FILTER (
        WHERE ps.stock_type_id = v_type_id
          AND ps.warehouse_id IN (SELECT warehouse_id FROM wh)
      ), 0) AS stock_total
    FROM base b
    LEFT JOIN product_stock ps
      ON ps.product_variation_id = b.variation_id
    GROUP BY b.variation_id, b.sku, b.product_name, b.variation_name
  ),

  filtered AS (
    SELECT *
    FROM base_with_stock
    WHERE
      (
        (p_min_stock IS NULL AND p_max_stock IS NULL)
        OR (p_min_stock IS NOT NULL AND p_max_stock IS NULL AND stock_total >= p_min_stock)
        OR (p_min_stock IS NULL AND p_max_stock IS NOT NULL AND stock_total <= p_max_stock)
        OR (p_min_stock IS NOT NULL AND p_max_stock IS NOT NULL AND stock_total BETWEEN p_min_stock AND p_max_stock)
      )
  ),

  counted AS (
    SELECT f.*, COUNT(*) OVER() AS total_variations
    FROM filtered f
  ),

  paginated AS (
    SELECT *
    FROM counted
    ORDER BY
      CASE WHEN p_order = 'alp-asc' THEN product_name END ASC,
      CASE WHEN p_order = 'alp-dsc' THEN product_name END DESC,
      CASE WHEN p_order = 'stc-asc' THEN stock_total END ASC,
      CASE WHEN p_order = 'stc-dsc' THEN stock_total END DESC,
      variation_id ASC
    LIMIT p_size
    OFFSET v_offset
  )

  SELECT jsonb_build_object(
    'page', jsonb_build_object(
      'page', p_page,
      'size', p_size,
      'total', COALESCE(MAX(p.total_variations), 0),
      'type_id', v_type_id
    ),
    'data', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'variation_id', p.variation_id,
          'sku', p.sku,
          'product_name', p.product_name,
          'variation_name', p.variation_name,
          'stock_by_warehouse', (
            SELECT COALESCE(
              jsonb_agg(
                jsonb_build_object(
                  'warehouse_id', wh.warehouse_id,
                  'warehouse_name', wh.warehouse_name,
                  'stock', ps2.stock
                )
                ORDER BY wh.warehouse_id
              ),
              '[]'::jsonb
            )
            FROM wh
            LEFT JOIN product_stock ps2
              ON ps2.product_variation_id = p.variation_id
             AND ps2.warehouse_id = wh.warehouse_id
             AND ps2.stock_type_id = v_type_id
          )
        )
      ),
      '[]'::jsonb
    )
  )
  INTO result
  FROM paginated p;

  RETURN result;
END;$function$;
