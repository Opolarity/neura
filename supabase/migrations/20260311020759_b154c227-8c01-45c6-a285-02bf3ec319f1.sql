CREATE OR REPLACE FUNCTION public.sp_get_user_details_by_uid(p_uid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', ac.id,
        'name', ac.name,
        'middle_name', ac.middle_name,
        'last_name', ac.last_name,
        'last_name2', ac.last_name2,
        'document_type_id', ac.document_type_id,
        'document_number', ac.document_number,
        'show', ac.show,
        'is_active', ac.is_active,
        'created_at', ac.created_at,
        'user_name', pr.user_name,
        'profiles_id', pr."UID",
        'warehouse_id', pr.warehouse_id,
        'branch_id', pr.branch_id,
        'phone', pr.phone,
        'country_id', pr.country_id,
        'state_id', pr.state_id,
        'city_id', pr.city_id,
        'neighborhood_id', pr.neighborhood_id,
        'address', pr.address,
        'address_reference', pr.address_reference,
        'email', COALESCE(au.email, ''),
        'role_ids', COALESCE(
            (SELECT jsonb_agg(ur.role_id) FROM user_roles ur WHERE ur.user_id = pr."UID"),
            '[]'::jsonb
        ),
        'account_types', COALESCE(
            (SELECT jsonb_agg(jsonb_build_object('account_type_id', act.account_type_id))
             FROM account_types act WHERE act.account_id = ac.id),
            '[]'::jsonb
        )
    ) INTO result
    FROM profiles pr
    JOIN accounts ac ON ac.id = pr.account_id
    LEFT JOIN auth.users au ON au.id = pr."UID"
    WHERE pr."UID" = p_uid;

    IF result IS NULL THEN
        RETURN jsonb_build_object('error', 'User not found');
    END IF;

    RETURN result;
END;
$function$;