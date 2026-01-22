CREATE OR REPLACE FUNCTION public.get_products_list(
  p_min_price numeric DEFAULT NULL::numeric, 
  p_max_price numeric DEFAULT NULL::numeric, 
  p_category integer DEFAULT NULL::integer, 
  p_status boolean DEFAULT NULL::boolean, 
  p_web boolean DEFAULT NULL::boolean, 
  p_minstock integer DEFAULT NULL::integer, 
  p_maxstock integer DEFAULT NULL::integer, 
  p_order text DEFAULT NULL::text, 
  p_search text DEFAULT NULL::text, 
  p_page integer DEFAULT 1, 
  p_size integer DEFAULT 20
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  result JSONB;
  v_offset int := GREATEST((p_page - 1) * p_size, 0);
  v_warehouse_id int;
  v_search text := NULLIF(btrim(p_search), '');
BEGIN
  /* Warehouse del usuario */
  SELECT pr.warehouse_id
  INTO v_warehouse_id
  FROM profiles pr
  WHERE pr."UID" = auth.uid();

  IF v_warehouse_id IS NULL THEN
    RAISE EXCEPTION 'El usuario no tiene warehouse_id asignado';
  END IF;

  SELECT jsonb_build_object(
    'page',
      jsonb_build_object(
        'p_page', p_page,
        'p_size', p_size,
        'total', COALESCE(MAX(q.total_rows), 0)
      ),
    'data',
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'product_id', q.product_id,
            'name',       q.producto,
            'image_url',  q.imagen,
            'categories', q.categorias,
            'terminos',   q.terminos,
            'price',      q.price,
            'stock',      q.stock_total,
            'estado',     q.estado,
            'web',        q.web
          )
        ),
        '[]'::jsonb
      )
  )
  INTO result
  FROM (
    SELECT
      COUNT(*) OVER () AS total_rows,
      p.id AS product_id,
      p.title AS producto,
      p.active AS estado,
      p.web AS web,
      i.image_url AS imagen,
      cat.categorias,
      subq.terminos,
      CONCAT(subq.precio_min, '-', subq.precio_max) AS price,
      subq.precio_min,
      subq.precio_max,
      subq.stock_total
    FROM products p

    /* Imagen principal - LEFT JOIN para incluir productos sin imágenes */
    LEFT JOIN LATERAL (
      SELECT image_url
      FROM product_images
      WHERE product_id = p.id
      ORDER BY image_order
      LIMIT 1
    ) i ON true

    /* Categorías (AGREGADAS → evita duplicados) */
    LEFT JOIN (
      SELECT
        pc.product_id,
        STRING_AGG(DISTINCT c.name, ', ' ORDER BY c.name) AS categorias
      FROM product_categories pc
      JOIN categories c ON c.id = pc.category_id
      GROUP BY pc.product_id
    ) cat ON cat.product_id = p.id

    /* Términos, precios y stock */
    LEFT JOIN (
      SELECT
        t1.product_id,
        t1.terminos,
        t2.precio_min,
        t2.precio_max,
        COALESCE(t3.stock_total, 0) AS stock_total
      FROM (
        SELECT
          p2.id AS product_id,
          STRING_AGG(DISTINCT t.name, '-' ORDER BY t.name) AS terminos
        FROM products p2
        LEFT JOIN variations v ON v.product_id = p2.id
        LEFT JOIN variation_terms vt ON vt.product_variation_id = v.id
        LEFT JOIN terms t ON t.id = vt.term_id
        GROUP BY p2.id
      ) t1
      LEFT JOIN (
        SELECT
          p2.id AS product_id,
          MIN(COALESCE(pp.sale_price, pp.price)) AS precio_min,
          MAX(COALESCE(pp.sale_price, pp.price)) AS precio_max
        FROM products p2
        LEFT JOIN variations v ON v.product_id = p2.id
        LEFT JOIN product_price pp ON pp.product_variation_id = v.id
        GROUP BY p2.id
      ) t2 ON t2.product_id = t1.product_id
      LEFT JOIN (
        SELECT
          p2.id AS product_id,
          SUM(COALESCE(ps.stock,0)) AS stock_total
        FROM products p2
        LEFT JOIN variations v ON v.product_id = p2.id
        LEFT JOIN product_stock ps
          ON ps.product_variation_id = v.id
         AND ps.warehouse_id = v_warehouse_id
        GROUP BY p2.id
      ) t3 ON t3.product_id = t1.product_id
    ) subq ON subq.product_id = p.id

    WHERE
      p.is_active = true
      AND (p_status IS NULL OR p.active = p_status)
      AND (p_web IS NULL OR p.web = p_web)

      /* Filtro por categoría */
      AND (
        p_category IS NULL
        OR EXISTS (
          SELECT 1
          FROM product_categories pc
          WHERE pc.product_id = p.id
            AND pc.category_id = p_category
        )
      )

      /* Búsqueda textual */
      AND (
        v_search IS NULL
        OR p.title ILIKE '%' || v_search || '%'
        OR p.short_description ILIKE '%' || v_search || '%'
      )

      /* Filtro por stock */
      AND (p_minstock IS NULL OR COALESCE(subq.stock_total, 0) >= p_minstock)
      AND (p_maxstock IS NULL OR COALESCE(subq.stock_total, 0) <= p_maxstock)

      /* Filtro por precio */
      AND (p_min_price IS NULL OR subq.precio_min >= p_min_price)
      AND (p_max_price IS NULL OR subq.precio_max <= p_max_price)

    ORDER BY
      CASE WHEN p_order = 'name_asc'   THEN p.title END ASC,
      CASE WHEN p_order = 'name_desc'  THEN p.title END DESC,
      CASE WHEN p_order = 'price_asc'  THEN subq.precio_min END ASC,
      CASE WHEN p_order = 'price_desc' THEN subq.precio_min END DESC,
      CASE WHEN p_order = 'stock_asc'  THEN subq.stock_total END ASC,
      CASE WHEN p_order = 'stock_desc' THEN subq.stock_total END DESC,
      p.id DESC

    LIMIT p_size
    OFFSET v_offset
  ) q;

  -- Return the result directly without wrapping in productsdata again
  RETURN result;
END;
$function$;