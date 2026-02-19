
CREATE OR REPLACE FUNCTION public.sp_create_order(
  p_user_id UUID,
  p_branch_id BIGINT,
  p_warehouse_id BIGINT,
  p_order_data JSONB,
  p_products JSONB,
  p_payments JSONB,
  p_initial_situation_id BIGINT,
  p_is_existing_client BOOLEAN DEFAULT FALSE,
  p_change_entries JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id BIGINT;
  v_product JSONB;
  v_payment JSONB;
  v_change_entry JSONB;
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
  -- ============================================================
  -- PRE-PASO: VALIDACIÓN DE DISPONIBILIDAD (STOCK VIRTUAL)
  -- ============================================================
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

  -- ============================================================
  -- CONFIGURACIÓN DE TIPOS Y CLASES
  -- ============================================================
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

  -- Egress movement type for change entries
  SELECT ty.id INTO v_egress_movement_type_id
  FROM types ty
  JOIN modules mo on mo.id = ty.module_id and mo.code = 'MOV'
  WHERE ty.code = 'OUT' LIMIT 1;

  SELECT status_id, name, code INTO v_status_id, v_situation_name, v_situation_code
  FROM situations WHERE id = p_initial_situation_id;

  -- Lógica de estados de stock
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

  -- ============================================================
  -- STEP 0: Crear cliente si no existe
  -- ============================================================
  IF NOT p_is_existing_client THEN
    INSERT INTO accounts (
      document_type_id,
      document_number,
      name,
      last_name,
      last_name2,
      is_active,
      show
    ) VALUES (
      (p_order_data->>'document_type')::BIGINT,
      p_order_data->>'document_number',
      p_order_data->>'customer_name',
      p_order_data->>'customer_lastname_first',
      NULLIF(p_order_data->>'customer_lastname2', ''),
      TRUE,
      TRUE
    )
    RETURNING id INTO v_account_id;
  END IF;

  -- ============================================================
  -- STEP 1: Crear la cabecera de la orden
  -- ============================================================
  INSERT INTO orders (
    document_type, document_number, customer_name, customer_lastname,
    email, phone, sale_type_id, price_list_code, shipping_method_code,
    shipping_cost, country_id, state_id, city_id, neighborhood_id,
    address, address_reference, reception_person, reception_phone,
    subtotal, discount, total, change, user_id, branch_id, date
  ) VALUES (
    (p_order_data->>'document_type')::BIGINT,
    p_order_data->>'document_number',
    p_order_data->>'customer_name',
    p_order_data->>'customer_lastname',
    p_order_data->>'email',
    NULLIF(p_order_data->>'phone', '')::BIGINT,
    (p_order_data->>'sale_type')::BIGINT,
    p_order_data->>'price_list_code',
    p_order_data->>'shipping_method',
    NULLIF(p_order_data->>'shipping_cost', '')::NUMERIC,
    NULLIF(p_order_data->>'country_id', '')::BIGINT,
    NULLIF(p_order_data->>'state_id', '')::BIGINT,
    NULLIF(p_order_data->>'city_id', '')::BIGINT,
    NULLIF(p_order_data->>'neighborhood_id', '')::BIGINT,
    p_order_data->>'address',
    p_order_data->>'address_reference',
    p_order_data->>'reception_person',
    NULLIF(p_order_data->>'reception_phone', '')::INT,
    (p_order_data->>'subtotal')::NUMERIC,
    (p_order_data->>'discount')::NUMERIC,
    (p_order_data->>'total')::NUMERIC,
    COALESCE((p_order_data->>'change')::NUMERIC, 0),
    p_user_id,
    p_branch_id,
    NOW()
  )
  RETURNING id INTO v_order_id;

  -- ============================================================
  -- STEP 2: Productos y Movimientos de Stock
  -- ============================================================
  FOR v_product IN SELECT * FROM jsonb_array_elements(p_products)
  LOOP
    v_line_discount := (v_product->>'discount_amount')::NUMERIC * (v_product->>'quantity')::BIGINT;

    INSERT INTO stock_movements (
      product_variation_id, quantity, warehouse_id, movement_type,
      stock_type_id, is_active, completed, created_by
    ) VALUES (
      (v_product->>'variation_id')::BIGINT,
      -(v_product->>'quantity')::BIGINT,
      p_warehouse_id,
      v_movement_type_id,
      COALESCE((v_product->>'stock_type_id')::BIGINT, v_stock_type_id),
      v_stock_is_active,
      v_stock_completed,
      p_user_id
    )
    RETURNING id INTO v_stock_movement_id;

    INSERT INTO order_products (
      order_id, product_variation_id, quantity, product_price,
      product_discount, warehouses_id, stock_movement_id
    ) VALUES (
      v_order_id,
      (v_product->>'variation_id')::BIGINT,
      (v_product->>'quantity')::BIGINT,
      (v_product->>'price')::NUMERIC,
      v_line_discount,
      p_warehouse_id,
      v_stock_movement_id
    );

    -- Actualización física si la situación lo requiere (completado)
    IF v_stock_completed THEN
      UPDATE product_stock
      SET stock = stock - (v_product->>'quantity')::BIGINT
      WHERE product_variation_id = (v_product->>'variation_id')::BIGINT
        AND warehouse_id = p_warehouse_id
        AND stock_type_id = COALESCE((v_product->>'stock_type_id')::BIGINT, v_stock_type_id);
    END IF;
  END LOOP;

  -- ============================================================
  -- STEP 3: Pagos y Movimientos Financieros (Ingresos)
  -- ============================================================
  FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments)
  LOOP
    v_payment_business_account_id := NULLIF((v_payment->>'business_account_id')::BIGINT, 0);
    
    IF v_payment_business_account_id IS NULL THEN
      SELECT business_account_id INTO v_business_account_id
      FROM payment_methods
      WHERE id = (v_payment->>'payment_method_id')::BIGINT;
      v_payment_business_account_id := COALESCE(v_business_account_id, 1);
    END IF;

    INSERT INTO movements (
      amount, branch_id, business_account_id, movement_class_id,
      movement_type_id, payment_method_id, movement_date, user_id, description
    ) VALUES (
      (v_payment->>'amount')::NUMERIC,
      p_branch_id,
      v_payment_business_account_id,
      v_movement_class_id,
      v_sale_movement_type_id,
      (v_payment->>'payment_method_id')::BIGINT,
      (v_payment->>'date')::TIMESTAMP,
      p_user_id,
      'Pago de orden #' || v_order_id
    )
    RETURNING id INTO v_movement_id;

    INSERT INTO order_payment (
      order_id, payment_method_id, amount, date,
      gateway_confirmation_code, voucher_url, movement_id, business_acount_id
    ) VALUES (
      v_order_id,
      (v_payment->>'payment_method_id')::BIGINT,
      (v_payment->>'amount')::NUMERIC,
      (v_payment->>'date')::TIMESTAMP,
      v_payment->>'confirmation_code',
      v_payment->>'voucher_url',
      v_movement_id,
      v_payment_business_account_id
    )
    RETURNING id INTO v_order_payment_id;

    v_created_payments := v_created_payments || jsonb_build_object(
      'id', v_order_payment_id,
      'localIndex', v_payment_index
    );
    v_payment_index := v_payment_index + 1;
  END LOOP;

  -- ============================================================
  -- STEP 3.5: Vueltos (Change entries) como pagos negativos
  -- ============================================================
  FOR v_change_entry IN SELECT * FROM jsonb_array_elements(p_change_entries)
  LOOP
    v_change_amount := (v_change_entry->>'amount')::NUMERIC;
    
    -- Resolve business account for the change entry
    v_change_business_account_id := NULLIF((v_change_entry->>'business_account_id')::BIGINT, 0);
    
    IF v_change_business_account_id IS NULL THEN
      SELECT business_account_id INTO v_business_account_id
      FROM payment_methods
      WHERE id = (v_change_entry->>'payment_method_id')::BIGINT;
      v_change_business_account_id := COALESCE(v_business_account_id, 1);
    END IF;

    -- Create egress movement for the change
    INSERT INTO movements (
      amount, branch_id, business_account_id, movement_class_id,
      movement_type_id, payment_method_id, movement_date, user_id, description
    ) VALUES (
      v_change_amount,
      p_branch_id,
      v_change_business_account_id,
      v_movement_class_id,
      v_egress_movement_type_id,
      (v_change_entry->>'payment_method_id')::BIGINT,
      NOW(),
      p_user_id,
      'Vuelto de orden #' || v_order_id
    )
    RETURNING id INTO v_movement_id;

    -- Insert as negative amount in order_payment
    INSERT INTO order_payment (
      order_id, payment_method_id, amount, date,
      movement_id, business_acount_id
    ) VALUES (
      v_order_id,
      (v_change_entry->>'payment_method_id')::BIGINT,
      -v_change_amount,
      NOW(),
      v_movement_id,
      v_change_business_account_id
    );
  END LOOP;

  -- ============================================================
  -- STEP 4: Situación Inicial y Notas
  -- ============================================================
  INSERT INTO order_situations (order_id, situation_id, status_id, last_row, created_by)
  VALUES (v_order_id, p_initial_situation_id, v_status_id, TRUE, p_user_id);

  INSERT INTO notes (message, user_id, code)
  VALUES ('Pedido creado con situación: ' || v_situation_name, p_user_id, 'ORD')
  RETURNING id INTO v_note_id;

  INSERT INTO order_notes (order_id, note_id) VALUES (v_order_id, v_note_id);

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'payments', v_created_payments
  );
END;
$$;
