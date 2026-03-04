CREATE OR REPLACE FUNCTION sp_search_barcode_variations(
  p_page INT DEFAULT 1,
  p_size INT DEFAULT 10,
  p_search TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset INT;
  v_total INT;
  v_result JSON;
BEGIN
  v_offset := (p_page - 1) * p_size;

  SELECT COUNT(*)
  INTO v_total
  FROM variations v
  JOIN products p ON p.id = v.product_id
  WHERE v.is_active = true
    AND (
      p_search IS NULL
      OR p.title ILIKE '%' || p_search || '%'
      OR v.sku ILIKE '%' || p_search || '%'
      OR EXISTS (
        SELECT 1 FROM variation_terms vt
        JOIN terms t ON t.id = vt.term_id
        WHERE vt.product_variation_id = v.id
          AND t.name ILIKE '%' || p_search || '%'
      )
    );

  SELECT json_build_object(
    'data', COALESCE((
      SELECT json_agg(row_data ORDER BY product_title, variation_id)
      FROM (
        SELECT
          v.id AS variation_id,
          v.sku,
          p.title AS product_title,
          p.is_variable,
          COALESCE(
            (SELECT string_agg(t.name, '-' ORDER BY t.id)
             FROM variation_terms vt
             JOIN terms t ON t.id = vt.term_id
             WHERE vt.product_variation_id = v.id),
            ''
          ) AS terms_names,
          (SELECT ty.name
           FROM product_stock ps
           JOIN types ty ON ty.id = ps.stock_type_id
           WHERE ps.product_variation_id = v.id
           LIMIT 1
          ) AS stock_type_name
        FROM variations v
        JOIN products p ON p.id = v.product_id
        WHERE v.is_active = true
          AND (
            p_search IS NULL
            OR p.title ILIKE '%' || p_search || '%'
            OR v.sku ILIKE '%' || p_search || '%'
            OR EXISTS (
              SELECT 1 FROM variation_terms vt2
              JOIN terms t2 ON t2.id = vt2.term_id
              WHERE vt2.product_variation_id = v.id
                AND t2.name ILIKE '%' || p_search || '%'
            )
          )
        ORDER BY p.title, v.id
        LIMIT p_size OFFSET v_offset
      ) AS row_data
    ), '[]'::json),
    'page', json_build_object(
      'page', p_page,
      'size', p_size,
      'total', v_total
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;