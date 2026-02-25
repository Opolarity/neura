CREATE OR REPLACE FUNCTION public.sp_get_stock_types(
    p_page INT DEFAULT 1,
    p_size INT DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
    v_offset INT := GREATEST((p_page - 1) * p_size, 0);
BEGIN
    SELECT jsonb_build_object(
        'page', json_build_object(
            'page', p_page,
            'size', p_size,
            'total', COALESCE(MAX(q.total_rows), 0)
        ),
        'data', COALESCE(jsonb_agg(jsonb_build_object(
            'id', q.id,
            'name', q.name
        )), '[]'::JSONB)
    ) INTO result
    FROM (
        SELECT 
            COUNT(*) OVER() AS total_rows, 
            t.id,
            t.name
        FROM types t 
        JOIN modules m ON t.module_id = m.id AND m.code = 'STK'
        WHERE t.is_active = true
        ORDER BY t.id
        LIMIT p_size OFFSET v_offset
    ) q;

    RETURN result;
END;
$$;