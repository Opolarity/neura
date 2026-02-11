CREATE OR REPLACE FUNCTION sp_delete_payment_method(
    p_id INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE


    v_result JSONB;
BEGIN
    IF p_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'El ID es requerido para eliminar');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE id = p_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'No se encontró el método de pago con ese ID');
    END IF;

    DELETE FROM payment_methods WHERE id = p_id;

    RETURN jsonb_build_object('success', true, 'message', 'Eliminado correctamente');

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
