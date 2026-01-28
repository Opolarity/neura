-- ============================================================
-- sp_create_order: Transactional RPC for atomic order creation
-- Handles orders, products, stock movements, and payments atomically
-- ============================================================

CREATE OR REPLACE FUNCTION sp_create_order(
  p_user_id UUID,
  p_branch_id BIGINT,
  p_warehouse_id BIGINT,
  p_order_data JSONB,
  p_products JSONB,
  p_payments JSONB,
  p_initial_situation_id BIGINT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id BIGINT;
  v_product JSONB;
  v_payment JSONB;
  v_stock_movement_id BIGINT;
  v_movement_id BIGINT;
  v_order_payment_id BIGINT;
  v_movement_type_id BIGINT;
  v_stock_type_id BIGINT;
  v_movement_class_id BIGINT;
  v_sale_movement_type_id BIGINT;
  v_status_id BIGINT;
  v_existing_stock_id BIGINT;
  v_existing_stock BIGINT;
  v_business_account_id BIGINT;
  v_line_discount NUMERIC;
  v_payment_index INT := 0;
  v_created_payments JSONB := '[]'::JSONB;
BEGIN
  -- Get movement type ID for sales (VEN)
  SELECT id INTO v_movement_type_id
  FROM types WHERE code = 'VEN' LIMIT 1;
  IF v_movement_type_id IS NULL THEN v_movement_type_id := 1; END IF;

  -- Get stock type ID for production (PRD)
  SELECT id INTO v_stock_type_id
  FROM types WHERE code = 'PRD' LIMIT 1;
  IF v_stock_type_id IS NULL THEN v_stock_type_id := 9; END IF;

  -- Get movement class ID for income (ING)
  SELECT id INTO v_movement_class_id
  FROM types WHERE code = 'ING' LIMIT 1;
  IF v_movement_class_id IS NULL THEN v_movement_class_id := 1; END IF;

  -- Get sale movement type ID (VEN)
  SELECT id INTO v_sale_movement_type_id
  FROM types WHERE code = 'VEN' LIMIT 1;
  IF v_sale_movement_type_id IS NULL THEN v_sale_movement_type_id := 1; END IF;

  -- Get status ID from situation
  SELECT status_id INTO v_status_id
  FROM situations WHERE id = p_initial_situation_id;
  IF v_status_id IS NULL THEN
    RAISE EXCEPTION 'Invalid situation ID: %', p_initial_situation_id;
  END IF;

  -- ============================================================
  -- STEP 1: Create the order
  -- ============================================================
  INSERT INTO orders (
    document_type,
    document_number,
    customer_name,
    customer_lastname,
    email,
    phone,
    sale_type_id,
    shipping_method_code,
    shipping_cost,
    country_id,
    state_id,
    city_id,
    neighborhood_id,
    address,
    address_reference,
    reception_person,
    reception_phone,
    subtotal,
    discount,
    total,
    user_id,
    branch_id,
    date
  ) VALUES (
    (p_order_data->>'document_type')::BIGINT,
    p_order_data->>'document_number',
    p_order_data->>'customer_name',
    p_order_data->>'customer_lastname',
    p_order_data->>'email',
    NULLIF(p_order_data->>'phone', '')::BIGINT,
    (p_order_data->>'sale_type')::BIGINT,
    p_order_data->>'shipping_method',
    NULLIF(p_order_data->>'shipping_cost', '')::NUMERIC,
    NULLIF(p_order_data->>'country_id', '')::BIGINT,
    NULLIF(p_order_data->>'state_id', '')::BIGINT,
    NULLIF(p_order_data->>'city_id', '')::BIGINT,
    NULLIF(p_order_data->>'neighborhood_id', '')::BIGINT,
    p_order_data->>'address',
    p_order_data->>'address_reference',
    p_order_data->>'reception_person',
    NULLIF(p_order_data->>'reception_phone', '')::INTEGER,
    (p_order_data->>'subtotal')::NUMERIC,
    COALESCE((p_order_data->>'discount')::NUMERIC, 0),
    (p_order_data->>'total')::NUMERIC,
    p_user_id,
    p_branch_id,
    NOW()
  )
  RETURNING id INTO v_order_id;

  -- ============================================================
  -- STEP 2: Process each product
  -- ============================================================
  FOR v_product IN SELECT * FROM jsonb_array_elements(p_products) LOOP
    -- Calculate line discount
    v_line_discount := COALESCE((v_product->>'discount_amount')::NUMERIC, 0) * (v_product->>'quantity')::BIGINT;

    -- Create stock movement (negative for sales)
    INSERT INTO stock_movements (
      product_variation_id,
      quantity,
      warehouse_id,
      movement_type,
      stock_type_id,
      completed,
      created_by
    ) VALUES (
      (v_product->>'variation_id')::BIGINT,
      -(v_product->>'quantity')::BIGINT,
      p_warehouse_id,
      v_movement_type_id,
      v_stock_type_id,
      TRUE,
      p_user_id
    )
    RETURNING id INTO v_stock_movement_id;

    -- Insert order product
    INSERT INTO order_products (
      order_id,
      product_variation_id,
      quantity,
      product_price,
      product_discount,
      warehouses_id,
      stock_movement_id
    ) VALUES (
      v_order_id,
      (v_product->>'variation_id')::BIGINT,
      (v_product->>'quantity')::BIGINT,
      (v_product->>'price')::NUMERIC,
      v_line_discount,
      p_warehouse_id,
      v_stock_movement_id
    );

    -- Update product stock using UPSERT
    SELECT id, stock INTO v_existing_stock_id, v_existing_stock
    FROM product_stock
    WHERE product_variation_id = (v_product->>'variation_id')::BIGINT
      AND warehouse_id = p_warehouse_id
      AND stock_type_id = v_stock_type_id;

    IF v_existing_stock_id IS NOT NULL THEN
      UPDATE product_stock
      SET stock = v_existing_stock - (v_product->>'quantity')::BIGINT
      WHERE id = v_existing_stock_id;
    END IF;
  END LOOP;

  -- ============================================================
  -- STEP 3: Process each payment
  -- ============================================================
  FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments) LOOP
    -- Get business account from payment method
    SELECT business_account_id INTO v_business_account_id
    FROM payment_methods
    WHERE id = (v_payment->>'payment_method_id')::BIGINT;
    IF v_business_account_id IS NULL THEN v_business_account_id := 1; END IF;

    -- Create financial movement
    INSERT INTO movements (
      amount,
      branch_id,
      business_account_id,
      movement_class_id,
      movement_type_id,
      payment_method_id,
      movement_date,
      user_id,
      description
    ) VALUES (
      (v_payment->>'amount')::NUMERIC,
      p_branch_id,
      v_business_account_id,
      v_movement_class_id,
      v_sale_movement_type_id,
      (v_payment->>'payment_method_id')::BIGINT,
      (v_payment->>'date')::TIMESTAMP,
      p_user_id,
      'Pago de orden #' || v_order_id
    )
    RETURNING id INTO v_movement_id;

    -- Insert order payment
    INSERT INTO order_payment (
      order_id,
      payment_method_id,
      amount,
      date,
      gateway_confirmation_code,
      voucher_url,
      movement_id
    ) VALUES (
      v_order_id,
      (v_payment->>'payment_method_id')::BIGINT,
      (v_payment->>'amount')::NUMERIC,
      (v_payment->>'date')::TIMESTAMP,
      v_payment->>'confirmation_code',
      v_payment->>'voucher_url',
      v_movement_id
    )
    RETURNING id INTO v_order_payment_id;

    -- Add to created payments array
    v_created_payments := v_created_payments || jsonb_build_object(
      'id', v_order_payment_id,
      'localIndex', v_payment_index
    );
    v_payment_index := v_payment_index + 1;
  END LOOP;

  -- ============================================================
  -- STEP 4: Create initial order situation
  -- ============================================================
  INSERT INTO order_situations (
    order_id,
    situation_id,
    status_id,
    last_row
  ) VALUES (
    v_order_id,
    p_initial_situation_id,
    v_status_id,
    TRUE
  );

  -- Return success response
  RETURN jsonb_build_object(
    'success', TRUE,
    'order_id', v_order_id,
    'payments', v_created_payments
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RAISE EXCEPTION 'Failed to create order: %', SQLERRM;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION sp_create_order(UUID, BIGINT, BIGINT, JSONB, JSONB, JSONB, BIGINT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION sp_create_order IS 'Transactional RPC for atomic order creation. Handles orders, products, stock movements, and payments in a single transaction.';