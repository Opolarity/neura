CREATE OR REPLACE FUNCTION public.sp_get_movements(p_page integer DEFAULT 1, p_size integer DEFAULT 20, p_search text DEFAULT NULL::text, p_type integer DEFAULT NULL::integer, p_class integer DEFAULT NULL::integer, p_bussines_account integer DEFAULT NULL::integer, p_payment_method integer DEFAULT NULL::integer, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date, p_branches integer DEFAULT NULL::integer, p_order text DEFAULT NULL::text , p_sale_type integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  result   JSONB;
  v_offset INT := GREATEST((p_page - 1) * p_size, 0);
BEGIN
  SELECT jsonb_build_object(
    'page', jsonb_build_object(
      'page',  p_page,
      'size',  p_size,
      'total', COALESCE(MAX(k.total_rows), 0)
    ),
    'data', COALESCE(
      jsonb_agg(jsonb_build_object(
        'id',               k.id,
        'movement_date',    k.movement_date,
        'description',      k.description,
        'amount',           k.amount,
        'type',             k.type,
        'class',            k.class,
        'business_account', k.business_account,
        'payment_method',   k.payment_method,
        'user',             k.name_user,
        'branches',         k.branches
      )),
      '[]'::jsonb
    )
  )
  INTO result
  FROM (
    SELECT
      COUNT(*) OVER()       AS total_rows,
      m.id                  AS id,
      m.movement_date::DATE AS movement_date,
      m.description         AS description,
      m.amount              AS amount,
      ty.name               AS type,
      clas.name             AS class,
      bu.name               AS business_account,
      pay.name              AS payment_method,
      acco.name             AS name_user,
      bran.name             AS branches
    FROM  movements m
    JOIN  types ty    ON ty.id    = m.movement_type_id
                      AND (p_type IS NULL OR ty.id = p_type)
    JOIN  modules mo  ON mo.id    = ty.module_id
    JOIN  classes clas ON clas.id = m.movement_class_id
                      AND (p_class IS NULL OR clas.id = p_class)
    LEFT JOIN business_accounts bu ON bu.id = m.business_account_id
                      AND (p_bussines_account IS NULL OR bu.id = p_bussines_account)
    LEFT JOIN payment_methods pay ON pay.id = m.payment_method_id
                      AND (p_payment_method IS NULL OR pay.id = p_payment_method)
    LEFT JOIN order_payment op ON op.payment_method_id = pay.id 
    LEFT JOIN order ord ON op.order_id = ord.id
    LEFT JOIN sale_types st ON st.id = ord.sale_type_id AND (p_sale_type IS NULL OR st.id = p_sale_type)
    JOIN  branches bran ON bran.id = m.branch_id
                      AND (p_branches IS NULL OR bran.id = p_branches)
    JOIN  profiles pro  ON pro."UID" = m.user_id
    JOIN  accounts acco ON acco.id   = pro.account_id
    WHERE
      (p_bussines_account IS NULL OR bu.id = p_bussines_account)
      AND (p_payment_method IS NULL OR pay.id = p_payment_method)
      AND (
        p_search IS NULL
        OR clas.name ILIKE '%' || p_search || '%'
        OR pay.name  ILIKE '%' || p_search || '%'
      )
      AND (
        (p_start_date IS NULL AND p_end_date IS NULL)
        OR (p_start_date IS NOT NULL AND p_end_date IS NULL
            AND m.movement_date::DATE >= p_start_date)
        OR (p_start_date IS NULL AND p_end_date IS NOT NULL
            AND m.movement_date::DATE <= p_end_date)
        OR (p_start_date IS NOT NULL AND p_end_date IS NOT NULL
            AND m.movement_date::DATE BETWEEN p_start_date AND p_end_date)
      )
    ORDER BY
      CASE WHEN p_order = 'date-asc' THEN m.movement_date::DATE END ASC,
      CASE WHEN p_order = 'date-dsc' THEN m.movement_date::DATE END DESC,
      m.created_at DESC
    LIMIT  p_size
    OFFSET v_offset
  ) k;

  RETURN result;
END;
$function$