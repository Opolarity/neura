CREATE OR REPLACE FUNCTION public.sp_get_categories_product_count(p_search text DEFAULT NULL::text, p_page integer DEFAULT 1, p_size integer DEFAULT 20, p_parentcategory boolean DEFAULT NULL::boolean, p_description boolean DEFAULT NULL::boolean, p_image boolean DEFAULT NULL::boolean, p_min_products integer DEFAULT 0, p_max_products integer DEFAULT 0, p_order text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    result JSONB;
    v_offset INT := GREATEST((p_page - 1) * p_size, 0);
BEGIN
    SELECT 
        jsonb_build_object(
            'page',
            jsonb_build_object(
                'page', p_page,
                'size', p_size,
                'total', COALESCE(MAX(q.total_rows), 0)
            ),
            'data', COALESCE(jsonb_agg(jsonb_build_object(
                'id_category', q.id_category,
                'imagen', q.imagen,
                'nombre', q.nombre,
                'categoria_padre', q.categoria_padre,
                'descripcion', q.descripcion,
                'productos', q.productos
            )), '[]'::jsonb)
        )
    INTO result
    FROM (
        SELECT
            subq.total_rows,
            subq.id_category,
            subq.imagen,
            subq.nombre,
            subq.categoria_padre,
            subq.descripcion,
            subq.productos
        FROM (
            SELECT
                COUNT(*) OVER() AS total_rows,
                c.id AS id_category,
                c.image_url AS imagen,
                c.name AS nombre,
                cp.name AS categoria_padre,
                COALESCE(c.description, 'sin descripción') AS descripcion,
                COUNT(p.id) AS productos
            FROM categories c 
            LEFT JOIN product_categories pc ON pc.category_id = c.id 
            LEFT JOIN products p ON p.id = pc.product_id
            LEFT JOIN categories cp ON cp.id = c.parent_category
            WHERE 
                (
                    p_description IS NULL 
                    OR (p_description = TRUE AND c.description IS NOT NULL)
                    OR (p_description = FALSE AND c.description IS NULL)
                )
                AND (
                    p_parentcategory IS NULL 
                    OR (p_parentcategory = TRUE AND c.parent_category IS NULL)
                    OR (p_parentcategory = FALSE AND c.parent_category IS NOT NULL)
                )
                AND (
                    p_image IS NULL 
                    OR (p_image = TRUE AND c.image_url IS NOT NULL)
                    OR (p_image = FALSE AND c.image_url IS NULL)
                )
                AND (p_search IS NULL OR c.name ILIKE '%' || p_search || '%')
            GROUP BY c.id, c.image_url, c.name, c.description, cp.name
        ) subq
        WHERE (
            (p_min_products = 0 AND p_max_products = 0)
            OR (p_min_products = 0 AND p_max_products > 0 AND subq.productos <= p_max_products)
            OR (p_min_products > 0 AND p_max_products = 0 AND subq.productos >= p_min_products)
            OR (p_min_products > 0 AND p_max_products > 0 
                AND subq.productos BETWEEN p_min_products AND p_max_products)
        )
        ORDER BY 
            CASE WHEN p_order = 'prd-asc' THEN subq.productos END ASC,
            CASE WHEN p_order = 'prd-dsc' THEN subq.productos END DESC,
            CASE WHEN p_order = 'alp-dsc' THEN subq.nombre END DESC,
            CASE WHEN p_order IS NULL OR p_order = 'alp-asc' THEN subq.nombre END ASC,
            subq.id_category ASC
        LIMIT p_size 
        OFFSET v_offset
    ) q;
    
    RETURN result;
END;
$function$;