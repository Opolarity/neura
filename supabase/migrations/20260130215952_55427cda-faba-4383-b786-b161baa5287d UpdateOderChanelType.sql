CREATE OR REPLACE FUNCTION sp_update_order_channel_type(
    p_id INTEGER,
    p_module_id INTEGER,
    p_module_code VARCHAR,
    p_name VARCHAR,
    p_code VARCHAR
)
RETURNS JSONB 
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
  v_id INTEGER;
  
BEGIN
  IF p_module_id IS NULL OR p_module_id != 1 THEN
   RETURN jsonb_build_object(
    'sucess',false,
    'error','Modulo Incorrecto'
   );
  END IF;
 
  IF p_module_code IS NULL OR p_module_code != 'ORD' THEN   
   RETURN jsonb_build_object(
    'sucess',false,
    'error','Codigo del Modulo Incorrecto'
   );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM types WHERE id = p_id) THEN
    RETURN jsonb_build_object(
        'sucess', false, 
        'error', 'No se encontró el canal de venta con ese ID');
  END IF;
 
  IF p_name IS NULL OR TRIM(p_name) = '' THEN
      RETURN jsonb_build_object(
          'sucess',false,
          'error','El nombre es requerido'
      );
  END IF;
 
  IF p_code IS NULL OR TRIM (p_code) = '' then
      RETURN jsonb_build_object(
          'sucess',false,
          'error','El code es requerido'
      );
  END IF;
 
    UPDATE types
    SET name = p_name,
        code = p_code,
        updated_at = NOW()
    WHERE id = p_id
 
    SELECT jsonb_build_object(
        'success', true,
        'message', 'Canales de venta actualizada exitosamente',
        'data', jsonb_build_object(
            'id', ty.id,
            'name', ty.name,
            'code', ty.code,
            'created_at', ty.created_at,
            'updated_at', ty.updated_at
        )
    ) INTO v_result
    FROM types ty
    WHERE ty.id = v_id;
 
    RETURN v_result;
 
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );

END;
$$ ;
