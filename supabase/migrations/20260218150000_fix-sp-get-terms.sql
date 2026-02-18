CREATE OR REPLACE FUNCTION sp_get_terms(
  p_page int DEFAULT 1,
  p_size int DEFAULT 20,
  p_search text DEFAULT NULL,
  p_min_pr int DEFAULT NULL,
  p_max_pr int DEFAULT NULL,
  p_group int DEFAULT NULL,
  p_order text DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
  v_offset int := GREATEST((p_page - 1) * p_size, 0);
BEGIN
  WITH
  -- 1. Base: all term-group combinations with product count
  base_terms AS (
    SELECT
      tg.id   AS grupo_id,
      tg.name AS grupo,
      t.id    AS term_id,
      t.name  AS terminos,
      COUNT(p.id) AS productos
    FROM variations v
    JOIN variation_terms vt ON vt.product_variation_id = v.id
    JOIN terms t             ON t.id = vt.term_id
    JOIN term_groups tg      ON tg.id = t.term_group_id
      AND tg.is_active = true
      AND (p_group IS NULL OR tg.id = p_group)
    JOIN products p          ON p.id = v.product_id
    GROUP BY tg.id, tg.name, t.id, t.name
  ),

  -- 2. Apply search and product-count filters
  filtered_terms AS (
    SELECT *
    FROM base_terms
    WHERE
      (p_search IS NULL OR terminos ILIKE '%' || p_search || '%')
      AND (
        (p_min_pr IS NULL AND p_max_pr IS NULL)
        OR (p_min_pr IS NULL  AND p_max_pr IS NOT NULL AND productos <= p_max_pr)
        OR (p_min_pr IS NOT NULL AND p_max_pr IS NULL  AND productos >= p_min_pr)
        OR (p_min_pr IS NOT NULL AND p_max_pr IS NOT NULL AND productos BETWEEN p_min_pr AND p_max_pr)
      )
  ),

  -- 3. Aggregate terms per group
  grouped_terms AS (
    SELECT
      grupo_id,
      grupo,
      SUM(productos) AS total_productos,
      jsonb_agg(
        jsonb_build_object('id', term_id, 'name', terminos, 'products', productos)
        ORDER BY terminos ASC
      ) AS terms_json
    FROM filtered_terms
    GROUP BY grupo_id, grupo
  ),

  -- 4. Total count of matching groups (for pagination)
  total_count AS (
    SELECT COUNT(*) AS total FROM grouped_terms
  ),

  -- 5. Apply ordering and pagination to groups
  paginated_groups AS (
    SELECT
      grupo_id,
      grupo,
      total_productos,
      terms_json,
      ROW_NUMBER() OVER () AS rn
    FROM grouped_terms
    ORDER BY
      CASE WHEN p_order = 'prd-asc' THEN total_productos END ASC,
      CASE WHEN p_order = 'prd-dsc' THEN total_productos END DESC,
      grupo ASC
    LIMIT p_size OFFSET v_offset
  )

  SELECT jsonb_build_object(
    'page', jsonb_build_object(
      'page',  p_page,
      'size',  p_size,
      'total', COALESCE((SELECT total FROM total_count), 0)
    ),
    'data', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'group_id',   grupo_id,
            'group_name', grupo,
            'terms',      terms_json
          ) ORDER BY rn ASC
        )
        FROM paginated_groups
      ),
      '[]'::jsonb
    )
  ) INTO result;

  RETURN result;
END;
$$;
