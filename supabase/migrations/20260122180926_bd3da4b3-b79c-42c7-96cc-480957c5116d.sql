CREATE OR REPLACE FUNCTION public.sp_get_sale_products(
    p_page integer DEFAULT 1,
    p_size integer DEFAULT 10,
    p_search text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_offset integer;
    v_result jsonb;
    v_search text := NULLIF(btrim(p_search), '');
BEGIN
    v_offset := (p_page - 1) * p_size;

    WITH filtered_variations AS (
        SELECT DISTINCT
            p.id AS product_id,
            p.title AS product_title,
            v.id AS variation_id,
            v.sku
        FROM products p
        INNER JOIN variations v ON v.product_id = p.id
        LEFT JOIN variation_terms vt ON vt.product_variation_id = v.id
        LEFT JOIN terms t ON t.id = vt.term_id
        WHERE p.is_active = true 
          AND p.active = true 
          AND v.is_active = true
          AND (
            v_search IS NULL 
            OR p.title ILIKE '%' || v_search || '%'
            OR v.sku ILIKE '%' || v_search || '%'
            OR t.name ILIKE '%' || v_search || '%'
          )
    ),
    total_count AS (
        SELECT COUNT(*) AS total FROM filtered_variations
    ),
    paginated AS (
        SELECT * FROM filtered_variations
        ORDER BY product_title, variation_id
        LIMIT p_size OFFSET v_offset
    ),
    with_details AS (
        SELECT 
            pag.product_id,
            pag.product_title,
            pag.variation_id,
            pag.sku,
            COALESCE(
                (SELECT jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name))
                 FROM variation_terms vt
                 INNER JOIN terms t ON t.id = vt.term_id
                 WHERE vt.product_variation_id = pag.variation_id),
                '[]'::jsonb
            ) AS terms,
            COALESCE(
                (SELECT jsonb_agg(jsonb_build_object(
                    'price_list_id', pp.price_list_id,
                    'price', pp.price,
                    'sale_price', pp.sale_price
                ))
                 FROM product_price pp
                 WHERE pp.product_variation_id = pag.variation_id),
                '[]'::jsonb
            ) AS prices
        FROM paginated pag
    )
    SELECT jsonb_build_object(
        'data', COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'productId', wd.product_id,
                    'productTitle', wd.product_title,
                    'variationId', wd.variation_id,
                    'sku', wd.sku,
                    'terms', wd.terms,
                    'prices', wd.prices
                )
            ORDER BY wd.product_title, wd.variation_id) FROM with_details wd),
            '[]'::jsonb
        ),
        'page', jsonb_build_object(
            'page', p_page,
            'size', p_size,
            'total', (SELECT total FROM total_count)
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;