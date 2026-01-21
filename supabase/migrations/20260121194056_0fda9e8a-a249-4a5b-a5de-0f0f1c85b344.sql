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
SET search_path = public
AS $function$
DECLARE
    result JSONB;
    v_offset int := GREATEST((p_page - 1) * p_size, 0);
BEGIN
    SELECT jsonb_build_object(
        'page', jsonb_build_object(
            'page', p_page,
            'size', p_size,
            'total', COALESCE(MAX(k.total_rows), 0)
        ),
        'data', COALESCE(jsonb_agg(k.group_data), '[]'::jsonb)
    )
    INTO result
    FROM (
        SELECT 
            q.grupo,
            q.group_id,
            jsonb_build_object(
                'group_id', q.group_id,
                'group_name', q.grupo,
                'terms', jsonb_agg(jsonb_build_object(
                    'id', q.term_id,
                    'name', q.terminos,
                    'products', q.productos
                ))
            ) as group_data,
            MAX(q.total_rows) as total_rows
        FROM (
            SELECT 
                COUNT(*) OVER() AS total_rows,
                t.id AS term_id,
                t.name AS terminos,
                COUNT(p.id) AS productos,
                tg.id AS group_id,
                tg.name AS grupo
            FROM variations v 
            JOIN variation_terms vt ON vt.product_variation_id = v.id
            JOIN terms t ON t.id = vt.term_id
            JOIN term_groups tg ON tg.id = t.term_group_id 
                AND (p_group IS NULL OR tg.id = p_group)
            JOIN products p ON p.id = v.product_id
            GROUP BY t.id, t.name, tg.id, tg.name
        ) q
        WHERE (p_search IS NULL OR q.terminos ILIKE '%' || p_search || '%') AND (
            (p_min_pr IS NULL AND p_max_pr IS NULL)
            OR (p_min_pr IS NULL AND p_max_pr IS NOT NULL AND q.productos <= p_max_pr)
            OR (p_min_pr IS NOT NULL  AND p_max_pr IS NULL AND q.productos >= p_min_pr)
            OR (p_min_pr IS NOT NULL AND p_max_pr IS NOT NULL AND q.productos BETWEEN p_min_pr AND p_max_pr)
        ) 
        GROUP BY q.grupo, q.group_id
        ORDER BY q.grupo
        LIMIT p_size 
        OFFSET v_offset
    ) k;
    
    RETURN result;
END;
$function$;