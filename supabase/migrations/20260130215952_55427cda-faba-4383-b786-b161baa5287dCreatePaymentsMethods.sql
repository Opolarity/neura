CREATE OR REPLACE FUNCTION sp_create_payment_method(
    p_name VARCHAR,
    p_business_account_id INTEGER,
    p_active BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_result JSONB;
    v_id INTEGER;
BEGIN
    IF p_name IS NULL OR TRIM(p_name) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'El nombre es requerido');
    END IF;

    IF p_business_account_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'La cuenta de negocio es requerida');
    END IF;

    IF EXISTS (SELECT 1 FROM payment_methods WHERE name = p_name AND business_account_id = p_business_account_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Ya existe un método de pago con este nombre');
    END IF;

    INSERT INTO payment_methods (
        name, 
        business_account_id, 
        active
    )
    VALUES (
        p_name, 
        p_business_account_id, 
        p_active
    )
    RETURNING id INTO v_id;

    SELECT jsonb_build_object(
        'success', true,
        'message', 'Método de pago creado exitosamente',
        'data', jsonb_build_object(
            'id', pm.id,
            'name', pm.name,
            'business_account_id', pm.business_account_id,
            'active', pm.active
        )
    ) INTO v_result
    FROM payment_methods pm
    WHERE pm.id = v_id;

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;