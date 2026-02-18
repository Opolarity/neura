
-- Fix 1: Recreate view with correct virtual stock formula
-- quantity is already negative, so we ADD it (stock + negative = reduction)
CREATE OR REPLACE VIEW vw_product_stock_virtual AS
SELECT ps.id,
    ps.product_variation_id,
    ps.warehouse_id,
    ps.stock,
    ps.stock_type_id,
    (ps.stock::numeric + COALESCE(
      (SELECT sum(sm.quantity)
       FROM stock_movements sm
       WHERE sm.is_active = true
         AND sm.quantity < 0
         AND sm.completed = false
         AND sm.product_variation_id = ps.product_variation_id
         AND sm.warehouse_id = ps.warehouse_id
         AND sm.stock_type_id = ps.stock_type_id
      ), 0::numeric
    )) AS virtual_stock
FROM product_stock ps;

-- Fix 2: Add v.is_active = true filter to main query in sp_get_sale_products
CREATE OR REPLACE FUNCTION sp_get_sale_products(
  p_page integer DEFAULT 1,
  p_size integer DEFAULT 10,
  p_search text DEFAULT NULL,
  p_stock_type_id integer DEFAULT NULL,
  p_warehouse_id integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offset integer;
  v_total bigint;
  v_result jsonb;
BEGIN
  v_offset := (p_page - 1) * p_size;

  -- Count total matching variations (already filters v.is_active = true)
  SELECT COUNT(DISTINCT v.id)
  INTO v_total
  FROM variations v
  INNER JOIN products p ON p.id = v.product_id
  LEFT JOIN variation_terms vt ON vt.product_variation_id = v.id
  LEFT JOIN terms t ON t.id = vt.term_id
  WHERE v.is_active = true
    AND p.is_active = true
    AND (
      p_search IS NULL
      OR p_search = ''
      OR p.title ILIKE '%' || p_search || '%'
      OR v.sku ILIKE '%' || p_search || '%'
      OR t.name ILIKE '%' || p_search || '%'
    );

  -- Build result with paginated data
  SELECT jsonb_build_object(
    'data', COALESCE(jsonb_agg(row_data), '[]'::jsonb),
    'page', jsonb_build_object(
      'page', p_page,
      'size', p_size,
      'total', v_total
    )
  )
  INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'productId', p.id,
      'productTitle', p.title,
      'variationId', v.id,
      'sku', v.sku,
      'imageUrl', (
        SELECT COALESCE(
          (
            SELECT pi.image_url
            FROM product_variation_images pvi
            INNER JOIN product_images pi ON pi.id = pvi.product_image_id
            WHERE pvi.product_variation_id = v.id
            ORDER BY pi.image_order ASC
            LIMIT 1
          ),
          (
            SELECT pi.image_url
            FROM product_images pi
            WHERE pi.product_id = p.id
            ORDER BY pi.image_order ASC
            LIMIT 1
          )
        )
      ),
      'stock', COALESCE(
        (
          SELECT ps.virtual_stock
          FROM vw_product_stock_virtual ps
          WHERE ps.product_variation_id = v.id
            AND (p_warehouse_id IS NULL OR ps.warehouse_id = p_warehouse_id)
            AND (p_stock_type_id IS NULL OR ps.stock_type_id = p_stock_type_id)
          LIMIT 1
        ),
        0
      ),
      'terms', COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', t.id,
              'name', t.name
            )
          )
          FROM variation_terms vt2
          INNER JOIN terms t ON t.id = vt2.term_id
          WHERE vt2.product_variation_id = v.id
        ),
        '[]'::jsonb
      ),
      'prices', COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'price_list_id', pp.price_list_id,
              'price', pp.price,
              'sale_price', pp.sale_price
            )
          )
          FROM product_price pp
          WHERE pp.product_variation_id = v.id
        ),
        '[]'::jsonb
      )
    ) AS row_data
    FROM variations v
    INNER JOIN products p ON p.id = v.product_id
    WHERE p.is_active = true
      AND v.is_active = true  -- FIX: filter inactive variations
      AND (
        p_search IS NULL
        OR p_search = ''
        OR p.title ILIKE '%' || p_search || '%'
        OR v.sku ILIKE '%' || p_search || '%'
        OR EXISTS (
          SELECT 1
          FROM variation_terms vt
          INNER JOIN terms t ON t.id = vt.term_id
          WHERE vt.product_variation_id = v.id
            AND t.name ILIKE '%' || p_search || '%'
        )
      )
    GROUP BY v.id, p.id, p.title, v.sku
    ORDER BY p.title ASC, v.sku ASC
    LIMIT p_size
    OFFSET v_offset
  ) subquery;

  RETURN v_result;
END;
$$;
