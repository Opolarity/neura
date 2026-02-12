CREATE OR REPLACE FUNCTION sp_get_payment_method_details(
    p_id INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'business_account_id', p.business_account_id,
        'business_name', b.name,
        'active', p.active
    ) INTO v_result
    FROM payment_methods p
    LEFT JOIN business_accounts b ON p.business_account_id = b.id
    WHERE p.id = p_id;

    RETURN v_result;
END;
$$;