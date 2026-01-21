
CREATE OR REPLACE FUNCTION public.sp_create_product(p_title text, p_short_description text, p_description text, p_is_variable boolean, p_active boolean, p_web boolean, p_categories integer[], p_images jsonb, p_variations jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_product_id INTEGER;
  v_variation JSONB;
  v_variation_id INTEGER;
  v_image JSONB;
  v_image_id INTEGER;
  v_image_map JSONB := '{}';
  v_attr JSONB;
  v_price JSONB;
  v_stock JSONB;
  v_sel_img TEXT;
  v_cat_id INTEGER;
  v_sku TEXT;
  v_default_stock_type_id INTEGER;
  v_manual_movement_type_id INTEGER;
BEGIN
  -- Get default stock type ID by looking up PRD code (Production)
  SELECT t.id INTO v_default_stock_type_id
  FROM types t
  JOIN modules m ON t.module_id = m.id
  WHERE m.code = 'STK' AND t.code = 'PRD';

  -- Get manual movement type ID by looking up MAN code in STM module
  SELECT t.id INTO v_manual_movement_type_id
  FROM types t
  JOIN modules m ON t.module_id = m.id
  WHERE m.code = 'STM' AND t.code = 'MAN';

  -- 1. Insert product
  INSERT INTO products (title, short_description, description, is_variable, active, web)
  VALUES (p_title, p_short_description, p_description, p_is_variable, p_active, p_web)
  RETURNING id INTO v_product_id;

  -- 2. Insert categories (sin especificar id)
  IF p_categories IS NOT NULL AND array_length(p_categories, 1) > 0 THEN
    FOREACH v_cat_id IN ARRAY p_categories
    LOOP
      INSERT INTO product_categories (product_id, category_id)
      VALUES (v_product_id, v_cat_id);
    END LOOP;
  END IF;

  -- 3. Insert images and build mapping (sin especificar id)
  FOR v_image IN SELECT * FROM jsonb_array_elements(p_images)
  LOOP
    INSERT INTO product_images (product_id, image_url, image_order)
    VALUES (
      v_product_id, 
      v_image->>'url', 
      (v_image->>'order')::INTEGER
    )
    RETURNING id INTO v_image_id;
    
    v_image_map := v_image_map || jsonb_build_object(v_image->>'id', v_image_id);
  END LOOP;

  -- 4. Insert variations
  FOR v_variation IN SELECT * FROM jsonb_array_elements(p_variations)
  LOOP
    -- Create variation
    INSERT INTO variations (product_id)
    VALUES (v_product_id)
    RETURNING id INTO v_variation_id;
    
    -- Generate SKU: 100 + product_id(5 digits) + variation_id(4 digits)
    v_sku := '100' || LPAD(v_product_id::TEXT, 5, '0') || LPAD(v_variation_id::TEXT, 4, '0');
    
    UPDATE variations SET sku = v_sku WHERE id = v_variation_id;
    
    -- Insert terms (attributes)
    FOR v_attr IN SELECT * FROM jsonb_array_elements(v_variation->'attributes')
    LOOP
      INSERT INTO variation_terms (product_variation_id, term_id)
      VALUES (v_variation_id, (v_attr->>'term_id')::INTEGER);
    END LOOP;
    
    -- Insert prices (ahora incluye precio 0)
    FOR v_price IN SELECT * FROM jsonb_array_elements(v_variation->'prices')
    LOOP
      IF (v_price->>'price') IS NOT NULL OR (v_price->>'sale_price') IS NOT NULL THEN
        INSERT INTO product_price (product_variation_id, price_list_id, price, sale_price)
        VALUES (
          v_variation_id, 
          (v_price->>'price_list_id')::INTEGER,
          COALESCE((v_price->>'price')::NUMERIC, 0),
          NULLIF((v_price->>'sale_price')::NUMERIC, 0)
        );
      END IF;
    END LOOP;
    
    -- Insert stock (with stock_type_id support) AND create stock movements
    FOR v_stock IN SELECT * FROM jsonb_array_elements(v_variation->'stock')
    LOOP
      IF (v_stock->>'stock')::INTEGER > 0 THEN
        -- Insert product_stock
        INSERT INTO product_stock (product_variation_id, warehouse_id, stock, stock_type_id)
        VALUES (
          v_variation_id, 
          (v_stock->>'warehouse_id')::INTEGER, 
          (v_stock->>'stock')::INTEGER,
          COALESCE((v_stock->>'stock_type_id')::INTEGER, v_default_stock_type_id)
        );
        
        -- Insert stock movement for initial stock
        INSERT INTO stock_movements (
          product_variation_id,
          quantity,
          created_by,
          movement_type,
          warehouse_id,
          completed,
          stock_type_id,
          is_active
        ) VALUES (
          v_variation_id,
          (v_stock->>'stock')::INTEGER,
          auth.uid(),
          v_manual_movement_type_id,
          (v_stock->>'warehouse_id')::INTEGER,
          true,
          COALESCE((v_stock->>'stock_type_id')::INTEGER, v_default_stock_type_id),
          true
        );
      END IF;
    END LOOP;
    
    -- Insert variation images (only for variable products, sin especificar id)
    IF p_is_variable THEN
      FOR v_sel_img IN SELECT * FROM jsonb_array_elements_text(v_variation->'selectedImages')
      LOOP
        IF v_image_map ? v_sel_img THEN
          INSERT INTO product_variation_images (product_variation_id, product_image_id)
          VALUES (
            v_variation_id, 
            (v_image_map->>v_sel_img)::INTEGER
          );
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'product_id', v_product_id);
  
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error creating product: %', SQLERRM;
END;
$function$;
