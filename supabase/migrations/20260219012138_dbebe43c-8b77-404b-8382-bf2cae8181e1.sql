CREATE OR REPLACE FUNCTION public.get_user_functions(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_result JSON;
  v_role_id BIGINT;
  v_role_name TEXT;
  v_is_admin BOOLEAN;
BEGIN
  -- Obtener el rol del usuario
  SELECT r.id, r.name, r.admin
  INTO v_role_id, v_role_name, v_is_admin
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = p_user_id
  LIMIT 1;

  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'No role found for user %', p_user_id;
  END IF;

  -- Construir resultado con lógica condicional para admins
  SELECT json_build_object(
    'user_id', p_user_id,
    'role', json_build_object(
      'id',    v_role_id,
      'name',  v_role_name,
      'admin', v_is_admin
    ),
    'functions', COALESCE(
      CASE
        WHEN v_is_admin THEN (
          SELECT json_agg(json_build_object('id', f.id, 'name', f.name))
          FROM functions f
          WHERE f.active = true
        )
        ELSE (
          SELECT json_agg(json_build_object('id', f.id, 'name', f.name))
          FROM role_functions rf
          JOIN functions f ON f.id = rf.function_id
          WHERE rf.role_id = v_role_id
        )
      END,
      '[]'::json
    )
  ) INTO v_result;

  RETURN v_result;
END;
$function$;