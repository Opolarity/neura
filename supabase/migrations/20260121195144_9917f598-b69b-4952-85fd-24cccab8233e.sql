-- Drop all existing versions of sp_get_terms and recreate a single version
DROP FUNCTION IF EXISTS public.sp_get_terms(integer, integer, text, integer, integer, integer);
DROP FUNCTION IF EXISTS public.sp_get_terms(p_page integer, p_size integer, p_search text, p_min_pr integer, p_max_pr integer, p_group integer);

-- Recreate the function with proper parameter types
CREATE OR REPLACE FUNCTION public.sp_get_terms(
    p_page integer DEFAULT 1,
    p_size integer DEFAULT 20,
    p_search text DEFAULT NULL,
    p_min_pr integer DEFAULT NULL,
    p_max_pr integer DEFAULT NULL,
    p_group integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_offset integer;
    v_result jsonb;
BEGIN
    v_offset := (p_page - 1) * p_size;

    WITH base_query AS (
        SELECT 
            tg.id AS group_id,
            tg.name AS grupo,
            t.id AS term_id,
            t.name AS terminos,
            COUNT(DISTINCT vt.variation_id) AS productos
        FROM term_groups tg
        LEFT JOIN terms t ON t.term_group_id = tg.id
        LEFT JOIN variation_terms vt ON vt.term_id = t.id
        WHERE 
            (p_search IS NULL OR tg.name ILIKE '%' || p_search || '%' OR t.name ILIKE '%' || p_search || '%')
            AND (p_group IS NULL OR tg.id = p_group)
        GROUP BY tg.id, tg.name, t.id, t.name
        HAVING 
            (p_min_pr IS NULL OR COUNT(DISTINCT vt.variation_id) >= p_min_pr)
            AND (p_max_pr IS NULL OR COUNT(DISTINCT vt.variation_id) <= p_max_pr)
    ),
    grouped_data AS (
        SELECT 
            q.group_id,
            q.grupo AS group_name,
            jsonb_agg(
                jsonb_build_object(
                    'id', q.term_id,
                    'name', q.terminos,
                    'products', q.productos
                )
            ) AS terms
        FROM base_query q
        WHERE q.term_id IS NOT NULL
        GROUP BY q.group_id, q.grupo
    ),
    total_count AS (
        SELECT COUNT(DISTINCT group_id) AS total FROM grouped_data
    )
    SELECT jsonb_build_object(
        'data', COALESCE((SELECT jsonb_agg(row_to_json(g)) FROM (SELECT * FROM grouped_data LIMIT p_size OFFSET v_offset) g), '[]'::jsonb),
        'total', (SELECT total FROM total_count),
        'page', p_page,
        'size', p_size
    ) INTO v_result;

    RETURN v_result;
END;
$$;