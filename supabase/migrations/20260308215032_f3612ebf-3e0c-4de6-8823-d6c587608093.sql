CREATE OR REPLACE FUNCTION sp_get_terms(
  p_search text DEFAULT NULL,
  p_min_pr bigint DEFAULT NULL,
  p_max_pr bigint DEFAULT NULL,
  p_group bigint DEFAULT NULL,
  p_order text DEFAULT NULL,
  p_page int DEFAULT 1,
  p_size int DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  v_offset int := GREATEST((p_page - 1) * p_size, 0);
BEGIN
  WITH
  base_terms AS (
    SELECT
      tg.id   AS grupo_id,
      tg.name AS grupo,
      tg.description AS grupo_description,
      t.id    AS term_id,
      t.name  AS terminos,
      COUNT(DISTINCT p.id) AS productos
    FROM term_groups tg
    LEFT JOIN terms t ON t.term_group_id = tg.id AND t.is_active = true
    LEFT JOIN variation_terms vt ON vt.term_id = t.id
    LEFT JOIN variations v ON v.id = vt.product_variation_id
    LEFT JOIN products p ON p.id = v.product_id AND p.is_active = true
    WHERE tg.is_active = true
      AND (p_group IS NULL OR tg.id = p_group)
    GROUP BY tg.id, tg.name, tg.description, t.id, t.name
  ),
  grouped_terms AS (
    SELECT
      grupo_id,
      grupo,
      grupo_description,
      SUM(productos) AS total_productos,
      CASE 
        WHEN bool_and(term_id IS NULL) THEN '[]'::jsonb
        ELSE jsonb_agg(
          jsonb_build_object('id', term_id, 'name', terminos, 'products', productos)
          ORDER BY terminos ASC
        ) FILTER (WHERE term_id IS NOT NULL)
      END AS terms_json
    FROM base_terms
    GROUP BY grupo_id, grupo, grupo_description
  ),
  filtered_groups AS (
    SELECT *
    FROM grouped_terms
    WHERE
      (p_search IS NULL OR grupo ILIKE '%' || p_search || '%')
      AND (
        (p_min_pr IS NULL AND p_max_pr IS NULL)
        OR (p_min_pr IS NULL  AND p_max_pr IS NOT NULL AND total_productos <= p_max_pr)
        OR (p_min_pr IS NOT NULL AND p_max_pr IS NULL  AND total_productos >= p_min_pr)
        OR (p_min_pr IS NOT NULL AND p_max_pr IS NOT NULL AND total_productos BETWEEN p_min_pr AND p_max_pr)
      )
  ),
  total_count AS (
    SELECT COUNT(*) AS total FROM filtered_groups
  ),
  paginated_groups AS (
    SELECT
      grupo_id,
      grupo,
      grupo_description,
      total_productos,
      terms_json,
      ROW_NUMBER() OVER (
        ORDER BY
          CASE WHEN p_order = 'prd-asc' THEN total_productos END ASC,
          CASE WHEN p_order = 'prd-dsc' THEN total_productos END DESC,
          grupo ASC
      ) AS rn
    FROM filtered_groups
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
            'group_description', grupo_description,
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