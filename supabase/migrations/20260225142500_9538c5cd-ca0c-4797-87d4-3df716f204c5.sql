CREATE OR REPLACE FUNCTION sp_get_shipping_methods(
    p_search TEXT DEFAULT NULL,
    p_page INT DEFAULT 1,
    p_size INT DEFAULT 20,
    p_min_cost NUMERIC DEFAULT NULL,
    p_max_cost NUMERIC DEFAULT NULL,
    p_countries BIGINT DEFAULT NULL,
    p_states BIGINT DEFAULT NULL,
    p_cities BIGINT DEFAULT NULL,
    p_neighborhoods BIGINT DEFAULT NULL,
    p_order TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    v_offset int := GREATEST((p_page - 1) * p_size, 0);
BEGIN
    SELECT jsonb_build_object(
        'page', jsonb_build_object(
            'page', p_page,
            'size', p_size,
            'total', COALESCE(MAX(q.total_rows), 0)
        ),
        'data', COALESCE(jsonb_agg(jsonb_build_object(
            'id', q.id,
            'name_shipping', q.name,
            'min_cost', q.min_cost,
            'max_cost', q.max_cost,
            'zones', q.zones,
            'zones_count', q.zones_count
        )), '[]'::jsonb)
    ) INTO result
    FROM(
        SELECT
            sm.id,
            COALESCE(sm.name,'GRATIS') AS name,
            COALESCE(z.min_cost, 0) AS min_cost,
            COALESCE(z.max_cost, 0) AS max_cost,
            COALESCE(z.zones, '') AS zones,
            COALESCE(z.zones_count, 0) AS zones_count,
            COUNT(*) OVER() AS total_rows
        FROM shipping_methods sm
        LEFT JOIN (
            SELECT
                sc.shipping_method_id,
                MIN(sc.cost) AS min_cost,
                MAX(sc.cost) AS max_cost,
                COUNT(DISTINCT 
                    COALESCE(sc.neighborhood_id::text, '') || '-' ||
                    COALESCE(sc.city_id::text, '') || '-' ||
                    COALESCE(sc.state_id::text, '') || '-' ||
                    COALESCE(sc.country_id::text, '')
                ) AS zones_count,
                STRING_AGG(
                    DISTINCT
                    CASE
                        WHEN ne.id IS NOT NULL THEN ne.name
                        WHEN ci.id IS NOT NULL THEN ci.name
                        WHEN st.id IS NOT NULL THEN st.name
                        ELSE co.name
                    END,
                    ' | '
                    ORDER BY
                        CASE
                            WHEN ne.id IS NOT NULL THEN ne.name
                            WHEN ci.id IS NOT NULL THEN ci.name
                            WHEN st.id IS NOT NULL THEN st.name
                            ELSE co.name
                        END
                ) AS zones
            FROM shipping_costs sc
            LEFT JOIN countries co ON co.id = sc.country_id
            LEFT JOIN states st ON st.id = sc.state_id
            LEFT JOIN cities ci ON ci.id = sc.city_id
            LEFT JOIN neighborhoods ne ON ne.id = sc.neighborhood_id
            WHERE (p_countries IS NULL OR sc.country_id = p_countries)
                AND (p_states IS NULL OR sc.state_id = p_states)
                AND (p_cities IS NULL OR sc.city_id = p_cities)
                AND (p_neighborhoods IS NULL OR sc.neighborhood_id = p_neighborhoods)
            GROUP BY sc.shipping_method_id
        ) z ON z.shipping_method_id = sm.id
        WHERE 
        ((sm.id != 0) AND (
            p_search IS NULL
            OR sm.name ILIKE '%' || p_search || '%'
        )
        AND (
            (p_countries IS NULL AND p_states IS NULL AND p_cities IS NULL AND p_neighborhoods IS NULL)
            OR z.shipping_method_id IS NOT NULL
        )
        AND (p_min_cost IS NULL OR COALESCE(z.max_cost, 0) >= p_min_cost)
        AND (p_max_cost IS NULL OR COALESCE(z.min_cost, 0) <= p_max_cost))
        ORDER BY
            CASE WHEN p_order = 'alp-asc' THEN sm.name END ASC,
            CASE WHEN p_order = 'alp-dsc' THEN sm.name END DESC,
            CASE WHEN p_order = 'pri-asc' THEN COALESCE(z.min_cost, 0) END ASC,
            CASE WHEN p_order = 'pri-dec' THEN COALESCE(z.max_cost, 0) END DESC,
            sm.id ASC
        LIMIT p_size OFFSET v_offset
    ) q;
    
    RETURN result;
END;
$$;