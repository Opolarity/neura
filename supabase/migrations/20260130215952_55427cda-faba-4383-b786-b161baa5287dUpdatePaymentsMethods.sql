CREATE OR REPLACE FUNCTION sp_update_payment_method(
    p_id INTEGER,
    p_name VARCHAR DEFAULT NULL,
    p_business_account_id INTEGER DEFAULT NULL,
    p_active BOOLEAN DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE


    v_result JSONB;
BEGIN
    IF p_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'El ID es requerido para actualizar');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE id = p_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'No se encontró el método de pago con ese ID');
    END IF;

    UPDATE payment_methods
    SET
        name = COALESCE(p_name, name),
        business_account_id = COALESCE(p_business_account_id, business_account_id),
        active = COALESCE(p_active, active)
    WHERE id = p_id;

    SELECT jsonb_build_object(
        'success', true,
        'message', 'Actualizado correctamente',
        'data', jsonb_build_object(
            'id', pm.id,
            'name', pm.name,
            'business_account_id', pm.business_account_id,
            'active', pm.active
        )
    ) INTO v_result
    FROM payment_methods pm
    WHERE pm.id = p_id;

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;