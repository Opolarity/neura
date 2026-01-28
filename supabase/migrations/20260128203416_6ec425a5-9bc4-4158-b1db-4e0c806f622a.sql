-- Update sp_create_order to optionally create client in accounts table
CREATE OR REPLACE FUNCTION public.sp_create_order(
  p_user_id uuid, 
  p_branch_id bigint, 
  p_warehouse_id bigint, 
  p_order_data jsonb, 
  p_products jsonb, 
  p_payments jsonb, 
  p_initial_situation_id bigint,
  p_is_existing_client boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  v_account_id BIGINT;
BEGIN
  -- Get movement type ID for sales (VEN)
  SELECT ty.id INTO v_movement_type_id
  FROM types ty
  JOIN modules mo ON mo.id = ty.module_id and mo.code = 'STM'
  WHERE ty.code = 'ORD' LIMIT 1;

  -- Get stock type ID for production (PRD)
  SELECT ty.id INTO v_stock_type_id
  FROM types ty
  JOIN modules mo on mo.id = ty.module_id and mo.code = 'STK'
  WHERE ty.code = 'PRD' LIMIT 1;

  -- Get movement class ID for income (ING)
  SELECT ty.id INTO v_movement_class_id
  FROM types ty
    JOIN modules mo on mo.id = ty.module_id and mo.code = 'MOV'
  WHERE ty.code = 'ORD' LIMIT 1;
  
  -- Get sale movement type ID (INC)
  SELECT ty.id INTO v_sale_movement_type_id
  FROM types ty
    JOIN modules mo on mo.id = ty.module_id and mo.code = 'MOV'
  WHERE ty.code = 'INC' LIMIT 1;

  -- Get status ID from situation
  SELECT status_id INTO v_status_id
  FROM situations WHERE id = p_initial_situation_id;

  -- ============================================================
  -- STEP 0: Create client in accounts if not existing
  -- ============================================================
  IF NOT p_is_existing_client THEN
    INSERT INTO accounts (
      document_type_id,
      document_number,
      name,
      last_name,
      is_active,
      show
    ) VALUES (
      (p_order_data->>'document_type')::BIGINT,
      p_order_data->>'document_number',
      p_order_data->>'customer_name',
      p_order_data->>'customer_lastname',
      TRUE,
      TRUE
    )
    RETURNING id INTO v_account_id;
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

    -- Update product_stock
    SELECT id, stock INTO v_existing_stock_id, v_existing_stock
    FROM product_stock
    WHERE product_variation_id = (v_product->>'variation_id')::BIGINT
      AND warehouse_id = p_warehouse_id
      AND stock_type_id = COALESCE((v_product->>'stock_type_id')::BIGINT, v_stock_type_id)
    LIMIT 1;

    IF v_existing_stock_id IS NOT NULL THEN
      UPDATE product_stock
      SET stock = v_existing_stock - (v_product->>'quantity')::BIGINT
      WHERE id = v_existing_stock_id;
    ELSE
      INSERT INTO product_stock (
        product_variation_id,
        warehouse_id,
        stock_type_id,
        stock
      ) VALUES (
        (v_product->>'variation_id')::BIGINT,
        p_warehouse_id,
        COALESCE((v_product->>'stock_type_id')::BIGINT, v_stock_type_id),
        -(v_product->>'quantity')::BIGINT
      );
    END IF;
  END LOOP;

  -- ============================================================
  -- STEP 3: Process payments
  -- ============================================================
  FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments) LOOP
    -- Get business account for payment method
    SELECT business_account_id INTO v_business_account_id
    FROM payment_methods
    WHERE id = (v_payment->>'payment_method_id')::BIGINT;

    -- Create movement for payment
    INSERT INTO movements (
      amount,
      movement_date,
      movement_type_id,
      movement_class_id,
      payment_method_id,
      business_account_id,
      branch_id,
      user_id
    ) VALUES (
      (v_payment->>'amount')::NUMERIC,
      COALESCE((v_payment->>'date')::TIMESTAMP, NOW()),
      v_sale_movement_type_id,
      v_movement_class_id,
      (v_payment->>'payment_method_id')::BIGINT,
      COALESCE(v_business_account_id, 1),
      p_branch_id,
      p_user_id
    )
    RETURNING id INTO v_movement_id;

    -- Create order payment
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
      COALESCE((v_payment->>'date')::TIMESTAMP, NOW()),
      v_payment->>'confirmation_code',
      v_payment->>'voucher_url',
      v_movement_id
    )
    RETURNING id INTO v_order_payment_id;

    -- Add to created payments array with local index
    v_created_payments := v_created_payments || jsonb_build_object(
      'id', v_order_payment_id,
      'localIndex', v_payment_index
    );
    v_payment_index := v_payment_index + 1;

    -- Update business account total
    UPDATE business_accounts
    SET total_amount = total_amount + (v_payment->>'amount')::NUMERIC
    WHERE id = COALESCE(v_business_account_id, 1);
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

  -- Return order ID and created payments
  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'payments', v_created_payments
  );
END;
$function$;