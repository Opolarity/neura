CREATE OR REPLACE FUNCTION public.sp_get_users(p_person_type integer DEFAULT NULL::integer, p_show boolean DEFAULT NULL::boolean, p_role integer DEFAULT NULL::integer, p_warehouses integer DEFAULT NULL::integer, p_branches integer DEFAULT NULL::integer, p_order text DEFAULT NULL::text, p_search text DEFAULT NULL::text, p_page integer DEFAULT 1, p_size integer DEFAULT 20)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$DECLARE
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
              'id',q.id,
              'profiles_id',q.profiles_id,
              'name',q.name,
              'middle_name',q.middle_name,  
              'last_name',q.last_name,
              'last_name2',q.last_name2,
              'document_type_id',q.document_type_id,
              'document_number',q.document_number,
              'warehouse_id',q.warehouse_id,
              'warehouse',q.warehouse,
              'branches_id',q.branches_id,
              'branches',q.branches,
              'created_at',q.created_at,
              'role',q.role,
              'show',q.show,
              'type_name',q.type_name         
        )), '[]'::jsonb)
    ) INTO result
FROM(
    SELECT 
        COUNT(*) OVER() AS total_rows,
        ac.id AS id,
        ac.name AS name,
        ac.middle_name AS middle_name,
        ac.last_name AS last_name,
        ac.last_name2 AS last_name2,
        dt.id AS document_type_id,
        dt.name AS document_type,
        ac.document_number AS document_number,
        wr.id AS warehouse_id,
        wr.name AS warehouse,
        br.id AS branches_id,
        br.name AS branches,
        pr."UID" AS profiles_id,
        pr.created_at AS created_at,
        user_role.role_names AS role,
        ac.show AS show,
        acc_type.type_name AS type_name
    FROM accounts ac
    JOIN profiles pr ON pr.account_id = ac.id 
        AND pr.is_active = true  
    JOIN document_types dt ON dt.id = ac.document_type_id
    JOIN warehouses wr ON wr.id = pr.warehouse_id 
        AND (p_warehouses IS NULL OR wr.id = p_warehouses)  
    JOIN branches br ON br.id = pr.branch_id 
        AND (p_branches IS NULL OR br.id = p_branches)
    LEFT JOIN LATERAL (
        SELECT 
            STRING_AGG(ro.name, ', ' ORDER BY ur.id) AS role_names
        FROM user_roles ur
        JOIN roles ro ON ro.id = ur.role_id
        WHERE ur.user_id = pr."UID"
    ) user_role ON true
    LEFT JOIN LATERAL (
        SELECT 
            act.account_id,
            ty.name AS type_name
        FROM account_types act
        JOIN types ty ON ty.id = act.account_type_id
        WHERE act.account_id = ac.id
        ORDER BY act.id
        LIMIT 1
    ) acc_type ON true
    WHERE 
        (ac.id != 0) AND
        (p_person_type IS NULL OR dt.person_type = p_person_type) AND
        (p_show IS NULL OR ac.show = p_show) AND
        (p_role IS NULL OR EXISTS (
            SELECT 1 
            FROM user_roles ur 
            WHERE ur.user_id = pr."UID" 
            AND ur.role_id = p_role
        )) AND
        (p_search IS NULL OR 
         ac.name ILIKE '%' || p_search || '%' OR
         ac.middle_name ILIKE '%' || p_search || '%' OR
         ac.last_name ILIKE '%' || p_search || '%' OR
         ac.last_name2 ILIKE '%' || p_search || '%' OR
         ac.document_number ILIKE '%' || p_search || '%')
        AND EXISTS (
            SELECT 1 FROM account_types act2
            JOIN types ty2 ON ty2.id = act2.account_type_id
            WHERE act2.account_id = ac.id AND ty2.code = 'COL'
        )
    ORDER BY
        CASE WHEN p_order = 'alp-asc' THEN ac.name END ASC,
        CASE WHEN p_order = 'alp-dsc' THEN ac.name END DESC,
        CASE WHEN p_order = 'date-asc' THEN pr.created_at END ASC,
        CASE WHEN p_order = 'date-dec' THEN pr.created_at END DESC,
        pr.created_at ASC
    LIMIT p_size 
    OFFSET v_offset  
)q;

RETURN result;
END;$function$;