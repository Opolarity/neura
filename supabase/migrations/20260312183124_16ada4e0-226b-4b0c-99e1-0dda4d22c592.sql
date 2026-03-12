CREATE OR REPLACE FUNCTION public.sp_create_order(
  p_user_id uuid,
  p_branch_id bigint,
  p_warehouse_id bigint,
  p_order_data jsonb,
  p_products jsonb,
  p_payments jsonb,
  p_initial_situation_id bigint,
  p_is_existing_client boolean DEFAULT false,
  p_change_entries jsonb DEFAULT '[]'::jsonb,
  p_discounts jsonb DEFAULT '[]'::jsonb
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
  v_change_entry JSONB;
  v_discount JSONB;
  v_stock_movement_id BIGINT;
  v_movement_id BIGINT;
  v_order_payment_id BIGINT;
  v_movement_type_id BIGINT;
  v_stock_type_id BIGINT;
  v_movement_class_id BIGINT;
  v_sale_movement_type_id BIGINT;
  v_egress_movement_type_id BIGINT;
  v_status_id BIGINT;
  v_existing_stock_id BIGINT;
  v_existing_stock BIGINT;
  v_business_account_id BIGINT;
  v_line_discount NUMERIC;
  v_payment_index INT := 0;
  v_created_payments JSONB := '[]'::JSONB;
  v_account_id BIGINT;
  v_situation_name TEXT;
  v_situation_code TEXT;
  v_note_id BIGINT;
  v_stock_is_active BOOLEAN;
  v_stock_completed BOOLEAN;
  v_payment_business_account_id BIGINT;
  v_change_business_account_id BIGINT;
  v_change_amount NUMERIC;
BEGIN
  FOR v_product IN SELECT * FROM jsonb_array_elements(p_products)
  LOOP
    SELECT virtual_stock INTO v_existing_stock
    FROM vw_product_stock_virtual
    WHERE product_variation_id = (v_product->>'variation_id')::BIGINT
      AND warehouse_id = p_warehouse_id;

    IF v_existing_stock IS NULL OR v_existing_stock < (v_product->>'quantity')::BIGINT THEN
      RAISE EXCEPTION 'STOCK_OUT: Variación % sin stock suficiente. Disponible: %', 
        (v_product->>'variation_id'), COALESCE(v_existing_stock, 0);
    END IF;
  END LOOP;

  SELECT ty.id INTO v_movement_type_id
  FROM types ty
  JOIN modules mo ON mo.id = ty.module_id and mo.code = 'STM'
  WHERE ty.code = 'ORD' LIMIT 1;

  SELECT ty.id INTO v_stock_type_id
  FROM types ty
  JOIN modules mo on mo.id = ty.module_id and mo.code = 'STK'
  WHERE ty.code = 'PRD' LIMIT 1;

  SELECT cl.id INTO v_movement_class_id
  FROM classes cl
  JOIN modules mo on mo.id = cl.module_id and mo.code = 'MOV'
  WHERE cl.code = 'ORD' LIMIT 1;
  
  SELECT ty.id INTO v_sale_movement_type_id
  FROM types ty
  JOIN modules mo on mo.id = ty.module_id and mo.code = 'MOV'
  WHERE ty.code = 'INC' LIMIT 1;

  SELECT ty.id INTO v_egress_movement_type_id
  FROM types ty
  JOIN modules mo on mo.id = ty.module_id and mo.code = 'MOV'
  WHERE ty.code = 'OUT' LIMIT 1;

  SELECT status_id, name, code INTO v_status_id, v_situation_name, v_situation_code
  FROM situations WHERE id = p_initial_situation_id;

  CASE v_situation_code
    WHEN 'PHY' THEN
      v_stock_is_active := TRUE;
      v_stock_completed := TRUE;
    WHEN 'HDN' THEN
      v_stock_is_active := FALSE;
      v_stock_completed := FALSE;
    WHEN 'VIR' THEN
      v_stock_is_active := TRUE;
      v_stock_completed := FALSE;
    ELSE
      v_stock_is_active := TRUE;
      v_stock_completed := TRUE;
  END CASE;

  IF NOT p_is_existing_client THEN
    INSERT INTO accounts (
      document_type_id, document_number, name, last_name, last_name2, is_active, show
    ) VALUES (
      (p_order_data->>'document_type')::BIGINT,
      p_order_data->>'document_number',
      p_order_data->>'customer_name',
      p_order_data->>'customer_lastname_first',
      NULLIF(p_order_data->>'customer_lastname2', ''),
      TRUE, TRUE
    )
    RETURNING id INTO v_account_id;
  END IF;

  INSERT INTO orders (
    document_type, document_number, customer_name, customer_lastname,
    email, phone, sale_type_id, price_list_code,
    shipping_method_code, shipping_cost, country_id, state_id, city_id,
    neighborhood_id, address, address_reference, reception_person, reception_phone,
    subtotal, discount, total, change, user_id, branch_id
  ) VALUES (
    (p_order_data->>'document_type')::BIGINT,
    p_order_data->>'document_number',
    p_order_data->>'customer_name',
    p_order_data->>'customer_lastname',
    NULLIF(p_order_data->>'email', ''),
    NULLIF(p_order_data->>'phone', '')::BIGINT,
    COALESCE((p_order_data->>'sale_type_id')::BIGINT, (p_order_data->>'sale_type')::BIGINT),
    p_order_data->>'price_list_code',
    NULLIF(p_order_data->>'shipping_method_code', ''),
    COALESCE((p_order_data->>'shipping_cost')::NUMERIC, 0),
    NULLIF(p_order_data->>'country_id', '')::BIGINT,
    NULLIF(p_order_data->>'state_id', '')::BIGINT,
    NULLIF(p_order_data->>'city_id', '')::BIGINT,
    NULLIF(p_order_data->>'neighborhood_id', '')::BIGINT,
    NULLIF(p_order_data->>'address', ''),
    NULLIF(p_order_data->>'address_reference', ''),
    NULLIF(p_order_data->>'reception_person', ''),
    NULLIF(p_order_data->>'reception_phone', '')::BIGINT,
    COALESCE((p_order_data->>'subtotal')::NUMERIC, 0),
    COALESCE((p_order_data->>'discount')::NUMERIC, 0),
    COALESCE((p_order_data->>'total')::NUMERIC, 0),
    COALESCE((p_order_data->>'change')::NUMERIC, 0),
    p_user_id,
    p_branch_id
  ) RETURNING id INTO v_order_id;

  -- Notes
  IF p_order_data->>'notes' IS NOT NULL AND p_order_data->>'notes' <> '' THEN
    INSERT INTO notes (message, user_id) VALUES (p_order_data->>'notes', p_user_id::TEXT)
    RETURNING id INTO v_note_id;
    INSERT INTO order_notes (order_id, note_id) VALUES (v_order_id, v_note_id);
  END IF;

  -- Products
  FOR v_product IN SELECT * FROM jsonb_array_elements(p_products)
  LOOP
    v_line_discount := COALESCE((v_product->>'discount_amount')::NUMERIC, 0);

    INSERT INTO stock_movements (
      product_variation_id, quantity, warehouse_id,
      movement_type, is_active, completed, date
    ) VALUES (
      (v_product->>'variation_id')::BIGINT,
      (v_product->>'quantity')::BIGINT,
      p_warehouse_id,
      v_movement_type_id,
      v_stock_is_active,
      v_stock_completed,
      NOW()
    ) RETURNING id INTO v_stock_movement_id;

    INSERT INTO order_products (
      order_id, product_variation_id, quantity,
      product_price, stock_movement_id, warehouses_id,
      product_discount
    ) VALUES (
      v_order_id,
      (v_product->>'variation_id')::BIGINT,
      (v_product->>'quantity')::BIGINT,
      (v_product->>'price')::NUMERIC,
      v_stock_movement_id,
      p_warehouse_id,
      v_line_discount
    );

    -- Update physical stock
    v_stock_type_id := COALESCE((v_product->>'stock_type_id')::BIGINT, v_stock_type_id);

    SELECT id INTO v_existing_stock_id
    FROM product_stock
    WHERE product_variation_id = (v_product->>'variation_id')::BIGINT
      AND warehouse_id = p_warehouse_id
      AND stock_type_id = v_stock_type_id
    LIMIT 1;

    IF v_existing_stock_id IS NOT NULL THEN
      UPDATE product_stock
      SET stock = stock - (v_product->>'quantity')::BIGINT
      WHERE id = v_existing_stock_id;
    ELSE
      INSERT INTO product_stock (product_variation_id, warehouse_id, stock, stock_type_id)
      VALUES (
        (v_product->>'variation_id')::BIGINT,
        p_warehouse_id,
        -(v_product->>'quantity')::BIGINT,
        v_stock_type_id
      );
    END IF;
  END LOOP;

  -- Payments
  FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments)
  LOOP
    v_payment_business_account_id := NULLIF(v_payment->>'business_account_id', 'null')::BIGINT;

    IF v_payment_business_account_id IS NULL THEN
      SELECT ba.id INTO v_payment_business_account_id
      FROM business_accounts ba
      JOIN payment_methods pm ON pm.business_account_id = ba.id
      WHERE pm.id = (v_payment->>'payment_method_id')::BIGINT
      LIMIT 1;
    END IF;

    v_payment_business_account_id := COALESCE(v_payment_business_account_id, 1);

    INSERT INTO movements (
      amount, branch_id, business_account_id,
      movement_class_id, movement_date, movement_type_id,
      payment_method_id, user_id, description
    ) VALUES (
      (v_payment->>'amount')::NUMERIC,
      p_branch_id,
      v_payment_business_account_id,
      v_movement_class_id,
      (v_payment->>'date')::TIMESTAMPTZ,
      v_sale_movement_type_id,
      (v_payment->>'payment_method_id')::BIGINT,
      p_user_id::TEXT,
      'Pago de orden #' || v_order_id
    ) RETURNING id INTO v_movement_id;

    INSERT INTO order_payment (
      order_id, payment_method_id, amount, date,
      gateway_confirmation_code, voucher_url,
      movement_id, business_acount_id
    ) VALUES (
      v_order_id,
      (v_payment->>'payment_method_id')::BIGINT,
      (v_payment->>'amount')::NUMERIC,
      (v_payment->>'date')::TIMESTAMPTZ,
      NULLIF(v_payment->>'confirmation_code', ''),
      NULLIF(v_payment->>'voucher_url', ''),
      v_movement_id,
      v_payment_business_account_id
    ) RETURNING id INTO v_order_payment_id;

    v_created_payments := v_created_payments || jsonb_build_object(
      'id', v_order_payment_id,
      'localIndex', v_payment_index
    );
    v_payment_index := v_payment_index + 1;
  END LOOP;

  -- Change entries (vueltos)
  FOR v_change_entry IN SELECT * FROM jsonb_array_elements(p_change_entries)
  LOOP
    v_change_amount := (v_change_entry->>'amount')::NUMERIC;
    v_change_business_account_id := NULLIF(v_change_entry->>'business_account_id', 'null')::BIGINT;

    IF v_change_business_account_id IS NULL THEN
      SELECT ba.id INTO v_change_business_account_id
      FROM business_accounts ba
      JOIN payment_methods pm ON pm.business_account_id = ba.id
      WHERE pm.id = (v_change_entry->>'payment_method_id')::BIGINT
      LIMIT 1;
    END IF;

    v_change_business_account_id := COALESCE(v_change_business_account_id, 1);

    INSERT INTO movements (
      amount, branch_id, business_account_id,
      movement_class_id, movement_date, movement_type_id,
      payment_method_id, user_id, description
    ) VALUES (
      v_change_amount,
      p_branch_id,
      v_change_business_account_id,
      v_movement_class_id,
      NOW(),
      v_egress_movement_type_id,
      (v_change_entry->>'payment_method_id')::BIGINT,
      p_user_id::TEXT,
      'Vuelto de orden #' || v_order_id
    );
  END LOOP;

  -- Discounts
  FOR v_discount IN SELECT * FROM jsonb_array_elements(p_discounts)
  LOOP
    INSERT INTO order_discounts (order_id, name, discount_amount, code)
    VALUES (
      v_order_id,
      v_discount->>'name',
      (v_discount->>'discount_amount')::NUMERIC,
      NULLIF(v_discount->>'code', '')
    );
  END LOOP;

  -- Situation
  INSERT INTO order_situations (order_id, situation_id, status_id, last_row, created_by)
  VALUES (v_order_id, p_initial_situation_id, v_status_id, TRUE, p_user_id::TEXT);

  RETURN jsonb_build_object(
    'order', jsonb_build_object('id', v_order_id),
    'payments', v_created_payments
  );
END;
$function$;

NOTIFY pgrst, 'reload schema';