-- Modificar el RPC sp_get_sale_products para aceptar p_warehouse_id
CREATE OR REPLACE FUNCTION public.sp_get_sale_products(
  p_page integer DEFAULT 1,
  p_size integer DEFAULT 10,
  p_search text DEFAULT NULL,
  p_stock_type_id bigint DEFAULT NULL,
  p_warehouse_id bigint DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset integer;
  v_total bigint;
  v_result jsonb;
BEGIN
  v_offset := (p_page - 1) * p_size;

  -- Count total matching variations
  SELECT COUNT(DISTINCT v.id)
  INTO v_total
  FROM variations v
  INNER JOIN products p ON p.id = v.product_id
  LEFT JOIN variation_terms vt ON vt.product_variation_id = v.id
  LEFT JOIN terms t ON t.id = vt.term_id
  WHERE p.active = true
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
        SELECT pi.image_url
        FROM product_variation_images pvi
        INNER JOIN product_images pi ON pi.id = pvi.product_image_id
        WHERE pvi.product_variation_id = v.id
        ORDER BY pi.image_order ASC
        LIMIT 1
      ),
      'stock', COALESCE(
        (
          SELECT ps.stock
          FROM product_stock ps
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
    WHERE p.active = true
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