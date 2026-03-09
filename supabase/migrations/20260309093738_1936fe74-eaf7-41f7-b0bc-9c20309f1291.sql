-- 1. Drop the OLD overload (without p_user_id) to eliminate ambiguity
DROP FUNCTION IF EXISTS public.sp_create_product(text, text, text, boolean, boolean, boolean, integer[], jsonb, jsonb);

-- 2. Replace sp_create_product with promotional fields support
CREATE OR REPLACE FUNCTION public.sp_create_product(
  p_title text,
  p_short_description text,
  p_description text,
  p_is_variable boolean,
  p_active boolean,
  p_web boolean,
  p_categories integer[],
  p_images jsonb,
  p_variations jsonb,
  p_user_id uuid DEFAULT NULL::uuid,
  p_promotional_text text DEFAULT NULL,
  p_promotional_bg_color text DEFAULT NULL,
  p_promotional_text_color text DEFAULT NULL,
  p_sizes_image_url text DEFAULT NULL
)
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
  v_created_by UUID;
BEGIN
  v_created_by := COALESCE(p_user_id, auth.uid());

  SELECT t.id INTO v_default_stock_type_id
  FROM types t JOIN modules m ON t.module_id = m.id
  WHERE m.code = 'STK' AND t.code = 'PRD';

  SELECT t.id INTO v_manual_movement_type_id
  FROM types t JOIN modules m ON t.module_id = m.id
  WHERE m.code = 'STM' AND t.code = 'MAN';

  -- 1. Insert product WITH promotional fields
  INSERT INTO products (title, short_description, description, is_variable, active, web, promotional_text, promotional_bg_color, promotional_text_color, sizes_image_url)
  VALUES (p_title, p_short_description, p_description, p_is_variable, p_active, p_web, p_promotional_text, p_promotional_bg_color, p_promotional_text_color, p_sizes_image_url)
  RETURNING id INTO v_product_id;

  -- 2. Insert categories
  IF p_categories IS NOT NULL AND array_length(p_categories, 1) > 0 THEN
    FOREACH v_cat_id IN ARRAY p_categories LOOP
      INSERT INTO product_categories (product_id, category_id) VALUES (v_product_id, v_cat_id);
    END LOOP;
  END IF;

  -- 3. Insert images and build mapping
  FOR v_image IN SELECT * FROM jsonb_array_elements(p_images) LOOP
    INSERT INTO product_images (product_id, image_url, image_order)
    VALUES (v_product_id, v_image->>'url', (v_image->>'order')::INTEGER)
    RETURNING id INTO v_image_id;
    v_image_map := v_image_map || jsonb_build_object(v_image->>'id', v_image_id);
  END LOOP;

  -- 4. Insert variations
  FOR v_variation IN SELECT * FROM jsonb_array_elements(p_variations) LOOP
    INSERT INTO variations (product_id) VALUES (v_product_id) RETURNING id INTO v_variation_id;
    v_sku := '100' || LPAD(v_product_id::TEXT, 5, '0') || LPAD(v_variation_id::TEXT, 4, '0');
    UPDATE variations SET sku = v_sku WHERE id = v_variation_id;

    FOR v_attr IN SELECT * FROM jsonb_array_elements(v_variation->'attributes') LOOP
      INSERT INTO variation_terms (product_variation_id, term_id) VALUES (v_variation_id, (v_attr->>'term_id')::INTEGER);
    END LOOP;

    FOR v_price IN SELECT * FROM jsonb_array_elements(v_variation->'prices') LOOP
      IF (v_price->>'price') IS NOT NULL OR (v_price->>'sale_price') IS NOT NULL THEN
        INSERT INTO product_price (product_variation_id, price_list_id, price, sale_price)
        VALUES (v_variation_id, (v_price->>'price_list_id')::INTEGER, COALESCE((v_price->>'price')::NUMERIC, 0), NULLIF((v_price->>'sale_price')::NUMERIC, 0));
      END IF;
    END LOOP;

    FOR v_stock IN SELECT * FROM jsonb_array_elements(v_variation->'stock') LOOP
      IF (v_stock->>'stock')::INTEGER > 0 THEN
        INSERT INTO product_stock (product_variation_id, warehouse_id, stock, stock_type_id)
        VALUES (v_variation_id, (v_stock->>'warehouse_id')::INTEGER, (v_stock->>'stock')::INTEGER, COALESCE((v_stock->>'stock_type_id')::INTEGER, v_default_stock_type_id));

        INSERT INTO stock_movements (product_variation_id, quantity, created_by, movement_type, warehouse_id, completed, stock_type_id, is_active)
        VALUES (v_variation_id, (v_stock->>'stock')::INTEGER, v_created_by, v_manual_movement_type_id, (v_stock->>'warehouse_id')::INTEGER, true, COALESCE((v_stock->>'stock_type_id')::INTEGER, v_default_stock_type_id), true);
      END IF;
    END LOOP;

    IF p_is_variable THEN
      FOR v_sel_img IN SELECT * FROM jsonb_array_elements_text(v_variation->'selectedImages') LOOP
        IF v_image_map ? v_sel_img THEN
          INSERT INTO product_variation_images (product_variation_id, product_image_id) VALUES (v_variation_id, (v_image_map->>v_sel_img)::INTEGER);
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'product_id', v_product_id);

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error creating product: %', SQLERRM;
END;
$function$;

-- 3. Update sp_update_product to include promotional fields
-- First get the full definition and recreate with new params
DROP FUNCTION IF EXISTS public.sp_update_product(integer, text, text, text, boolean, boolean, boolean, integer[], jsonb, jsonb, boolean, uuid);

CREATE OR REPLACE FUNCTION public.sp_update_product(
  p_product_id integer,
  p_product_name text,
  p_short_description text,
  p_description text,
  p_is_variable boolean,
  p_is_active boolean,
  p_is_web boolean,
  p_selected_categories integer[],
  p_product_images jsonb,
  p_variations jsonb,
  p_reset_variations boolean,
  p_user_id uuid,
  p_promotional_text text DEFAULT NULL,
  p_promotional_bg_color text DEFAULT NULL,
  p_promotional_text_color text DEFAULT NULL,
  p_sizes_image_url text DEFAULT NULL,
  OUT o_image_id_map jsonb,
  OUT o_images_to_delete jsonb
)
RETURNS record
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_default_stock_type_id  INTEGER;
  v_manual_movement_type   INTEGER;
  v_img                    JSONB;
  v_existing_image_ids     INTEGER[];
  v_img_record             RECORD;
  v_inserted_image_id      INTEGER;
  v_image_id_map           JSONB := '{}';
  v_images_to_delete       JSONB := '[]';
  v_variation              JSONB;
  v_existing_var           RECORD;
  v_new_var_id             INTEGER;
  v_sku                    TEXT;
  v_attr                   JSONB;
  v_price                  JSONB;
  v_stock                  JSONB;
  v_sel_img                TEXT;
  v_db_img_id              INTEGER;
  v_existing_key           TEXT;
  v_incoming_key           TEXT;
  v_keys_existing          TEXT[];
  v_keys_incoming          TEXT[];
  v_to_update_existing_ids INTEGER[];
  v_to_delete_ids          INTEGER[];
  v_to_create              JSONB[];
  v_pair                   RECORD;
  v_old_stock              RECORD;
  v_old_qty                NUMERIC;
  v_new_qty                NUMERIC;
  v_difference             NUMERIC;
  v_stock_type_id          INTEGER;
  v_linked_count           INTEGER;
BEGIN
  SELECT id INTO v_default_stock_type_id FROM types WHERE code = 'PRD' LIMIT 1;
  SELECT t.id INTO v_manual_movement_type FROM types t JOIN modules m ON m.id = t.module_id WHERE t.code = 'MAN' AND m.code = 'STM' LIMIT 1;

  -- 2. Update product basic data WITH promotional fields
  UPDATE products SET
    title                  = p_product_name,
    short_description      = p_short_description,
    description            = p_description,
    is_variable            = p_is_variable,
    active                 = p_is_active,
    web                    = p_is_web,
    promotional_text       = p_promotional_text,
    promotional_bg_color   = p_promotional_bg_color,
    promotional_text_color = p_promotional_text_color,
    sizes_image_url        = p_sizes_image_url
  WHERE id = p_product_id;

  -- 3. Categories
  DELETE FROM product_categories WHERE product_id = p_product_id;
  IF array_length(p_selected_categories, 1) > 0 THEN
    INSERT INTO product_categories (product_id, category_id) SELECT p_product_id, unnest(p_selected_categories);
  END IF;

  -- 4. Images
  SELECT ARRAY(
    SELECT REPLACE(img->>'id', 'existing-', '')::INTEGER
    FROM jsonb_array_elements(p_product_images) img
    WHERE img->>'id' LIKE 'existing-%'
  ) INTO v_existing_image_ids;

  SELECT jsonb_agg(pi.image_url) INTO v_images_to_delete
  FROM product_images pi
  WHERE pi.product_id = p_product_id
    AND (v_existing_image_ids IS NULL OR pi.id <> ALL(v_existing_image_ids));

  DELETE FROM product_images WHERE product_id = p_product_id;

  FOR v_img IN SELECT * FROM jsonb_array_elements(p_product_images) LOOP
    INSERT INTO product_images (product_id, image_url, image_order)
    VALUES (p_product_id, v_img->>'path', (v_img->>'order')::INTEGER)
    RETURNING id INTO v_inserted_image_id;
    v_image_id_map := v_image_id_map || jsonb_build_object(v_img->>'id', v_inserted_image_id);
  END LOOP;

  o_image_id_map     := v_image_id_map;
  o_images_to_delete := COALESCE(v_images_to_delete, '[]'::JSONB);

  -- 5. Price validations
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_variations) v, jsonb_array_elements(v->'prices') p
    WHERE (p->>'price') IS NOT NULL AND (p->>'price')::NUMERIC < 0
       OR (p->>'sale_price') IS NOT NULL AND (p->>'sale_price')::NUMERIC < 0
  ) THEN
    RAISE EXCEPTION 'Los precios no pueden ser negativos.';
  END IF;

  -- 6. Variations handling
  IF p_reset_variations THEN
    -- RESET mode: deactivate old, create new
    UPDATE variations SET is_active = false WHERE product_id = p_product_id AND is_active = true;

    FOR v_variation IN SELECT * FROM jsonb_array_elements(p_variations) LOOP
      INSERT INTO variations (product_id) VALUES (p_product_id) RETURNING id INTO v_new_var_id;
      v_sku := '100' || LPAD(p_product_id::TEXT, 5, '0') || LPAD(v_new_var_id::TEXT, 4, '0');
      UPDATE variations SET sku = v_sku WHERE id = v_new_var_id;

      FOR v_attr IN SELECT * FROM jsonb_array_elements(v_variation->'attributes') LOOP
        INSERT INTO variation_terms (product_variation_id, term_id) VALUES (v_new_var_id, (v_attr->>'term_id')::INTEGER);
      END LOOP;

      FOR v_price IN SELECT * FROM jsonb_array_elements(v_variation->'prices') LOOP
        INSERT INTO product_price (product_variation_id, price_list_id, price, sale_price)
        VALUES (v_new_var_id, (v_price->>'price_list_id')::INTEGER, COALESCE((v_price->>'price')::NUMERIC, 0), NULLIF((v_price->>'sale_price')::NUMERIC, 0));
      END LOOP;

      FOR v_stock IN SELECT * FROM jsonb_array_elements(v_variation->'stock') LOOP
        v_new_qty := COALESCE((v_stock->>'stock')::NUMERIC, 0);
        v_stock_type_id := COALESCE((v_stock->>'stock_type_id')::INTEGER, v_default_stock_type_id);
        IF v_new_qty > 0 THEN
          INSERT INTO product_stock (product_variation_id, warehouse_id, stock, stock_type_id)
          VALUES (v_new_var_id, (v_stock->>'warehouse_id')::INTEGER, v_new_qty, v_stock_type_id);
          INSERT INTO stock_movements (product_variation_id, quantity, created_by, movement_type, warehouse_id, completed, stock_type_id, is_active)
          VALUES (v_new_var_id, v_new_qty, p_user_id, v_manual_movement_type, (v_stock->>'warehouse_id')::INTEGER, true, v_stock_type_id, true);
        END IF;
      END LOOP;

      IF p_is_variable THEN
        FOR v_sel_img IN SELECT * FROM jsonb_array_elements_text(v_variation->'selectedImages') LOOP
          v_db_img_id := (v_image_id_map->>v_sel_img)::INTEGER;
          IF v_db_img_id IS NOT NULL THEN
            INSERT INTO product_variation_images (product_variation_id, product_image_id) VALUES (v_new_var_id, v_db_img_id);
          END IF;
        END LOOP;
      END IF;
    END LOOP;

  ELSE
    -- NORMAL mode: match by term key, update/create/delete
    SELECT ARRAY(
      SELECT string_agg(vt.term_id::TEXT, ',' ORDER BY vt.term_id)
      FROM variations v LEFT JOIN variation_terms vt ON vt.product_variation_id = v.id
      WHERE v.product_id = p_product_id AND v.is_active = true
      GROUP BY v.id ORDER BY v.id
    ) INTO v_keys_existing;

    SELECT ARRAY(
      SELECT string_agg((a->>'term_id')::TEXT, ',' ORDER BY (a->>'term_id')::INTEGER)
      FROM jsonb_array_elements(p_variations) var, jsonb_array_elements(var->'attributes') a
      GROUP BY var.ordinality
    ) INTO v_keys_incoming;

    v_to_update_existing_ids := '{}';
    v_to_delete_ids := '{}';
    v_to_create := '{}';

    -- Match existing variations
    FOR v_existing_var IN
      SELECT v.id, v.sku,
             string_agg(vt.term_id::TEXT, ',' ORDER BY vt.term_id) AS term_key
      FROM variations v LEFT JOIN variation_terms vt ON vt.product_variation_id = v.id
      WHERE v.product_id = p_product_id AND v.is_active = true
      GROUP BY v.id, v.sku
      ORDER BY v.id
    LOOP
      v_existing_key := COALESCE(v_existing_var.term_key, '');
      v_linked_count := 0;
      SELECT COUNT(*) INTO v_linked_count FROM (
        SELECT 1 FROM order_products WHERE product_variation_id = v_existing_var.id
        UNION ALL SELECT 1 FROM bar_codes WHERE product_variation_id = v_existing_var.id
        UNION ALL SELECT 1 FROM cart_products WHERE product_variation_id = v_existing_var.id
      ) sub;

      IF v_existing_key = ANY(v_keys_incoming) THEN
        v_to_update_existing_ids := array_append(v_to_update_existing_ids, v_existing_var.id);
      ELSIF v_linked_count > 0 THEN
        UPDATE variations SET is_active = false WHERE id = v_existing_var.id;
      ELSE
        v_to_delete_ids := array_append(v_to_delete_ids, v_existing_var.id);
      END IF;
    END LOOP;

    -- Delete unlinked variations
    IF array_length(v_to_delete_ids, 1) > 0 THEN
      DELETE FROM product_variation_images WHERE product_variation_id = ANY(v_to_delete_ids);
      DELETE FROM product_price WHERE product_variation_id = ANY(v_to_delete_ids);
      DELETE FROM product_stock WHERE product_variation_id = ANY(v_to_delete_ids);
      DELETE FROM variation_terms WHERE product_variation_id = ANY(v_to_delete_ids);
      DELETE FROM stock_movements WHERE product_variation_id = ANY(v_to_delete_ids);
      DELETE FROM variations WHERE id = ANY(v_to_delete_ids);
    END IF;

    -- Update existing variations
    FOR v_variation IN SELECT * FROM jsonb_array_elements(p_variations) LOOP
      v_incoming_key := (
        SELECT string_agg((a->>'term_id')::TEXT, ',' ORDER BY (a->>'term_id')::INTEGER)
        FROM jsonb_array_elements(v_variation->'attributes') a
      );

      SELECT v.id INTO v_new_var_id
      FROM variations v LEFT JOIN variation_terms vt ON vt.product_variation_id = v.id
      WHERE v.product_id = p_product_id AND v.is_active = true AND v.id = ANY(v_to_update_existing_ids)
      GROUP BY v.id
      HAVING COALESCE(string_agg(vt.term_id::TEXT, ',' ORDER BY vt.term_id), '') = COALESCE(v_incoming_key, '');

      IF v_new_var_id IS NULL THEN
        INSERT INTO variations (product_id) VALUES (p_product_id) RETURNING id INTO v_new_var_id;
        v_sku := '100' || LPAD(p_product_id::TEXT, 5, '0') || LPAD(v_new_var_id::TEXT, 4, '0');
        UPDATE variations SET sku = v_sku WHERE id = v_new_var_id;
        FOR v_attr IN SELECT * FROM jsonb_array_elements(v_variation->'attributes') LOOP
          INSERT INTO variation_terms (product_variation_id, term_id) VALUES (v_new_var_id, (v_attr->>'term_id')::INTEGER);
        END LOOP;
      END IF;

      -- Prices
      DELETE FROM product_price WHERE product_variation_id = v_new_var_id;
      FOR v_price IN SELECT * FROM jsonb_array_elements(v_variation->'prices') LOOP
        INSERT INTO product_price (product_variation_id, price_list_id, price, sale_price)
        VALUES (v_new_var_id, (v_price->>'price_list_id')::INTEGER, COALESCE((v_price->>'price')::NUMERIC, 0), NULLIF((v_price->>'sale_price')::NUMERIC, 0));
      END LOOP;

      -- Stock
      FOR v_stock IN SELECT * FROM jsonb_array_elements(v_variation->'stock') LOOP
        v_new_qty := COALESCE((v_stock->>'stock')::NUMERIC, 0);
        v_stock_type_id := COALESCE((v_stock->>'stock_type_id')::INTEGER, v_default_stock_type_id);

        SELECT * INTO v_old_stock FROM product_stock
        WHERE product_variation_id = v_new_var_id AND warehouse_id = (v_stock->>'warehouse_id')::INTEGER;

        IF v_old_stock IS NULL THEN
          IF v_new_qty > 0 THEN
            INSERT INTO product_stock (product_variation_id, warehouse_id, stock, stock_type_id)
            VALUES (v_new_var_id, (v_stock->>'warehouse_id')::INTEGER, v_new_qty, v_stock_type_id);
            INSERT INTO stock_movements (product_variation_id, quantity, created_by, movement_type, warehouse_id, completed, stock_type_id, is_active)
            VALUES (v_new_var_id, v_new_qty, p_user_id, v_manual_movement_type, (v_stock->>'warehouse_id')::INTEGER, true, v_stock_type_id, true);
          END IF;
        ELSE
          v_old_qty := v_old_stock.stock;
          v_difference := v_new_qty - v_old_qty;
          IF v_difference <> 0 THEN
            UPDATE product_stock SET stock = v_new_qty, stock_type_id = v_stock_type_id
            WHERE product_variation_id = v_new_var_id AND warehouse_id = (v_stock->>'warehouse_id')::INTEGER;
            INSERT INTO stock_movements (product_variation_id, quantity, created_by, movement_type, warehouse_id, completed, stock_type_id, is_active)
            VALUES (v_new_var_id, v_difference, p_user_id, v_manual_movement_type, (v_stock->>'warehouse_id')::INTEGER, true, v_stock_type_id, true);
          END IF;
        END IF;
      END LOOP;

      -- Variation images
      DELETE FROM product_variation_images WHERE product_variation_id = v_new_var_id;
      IF p_is_variable THEN
        FOR v_sel_img IN SELECT * FROM jsonb_array_elements_text(v_variation->'selectedImages') LOOP
          v_db_img_id := (v_image_id_map->>v_sel_img)::INTEGER;
          IF v_db_img_id IS NOT NULL THEN
            INSERT INTO product_variation_images (product_variation_id, product_image_id) VALUES (v_new_var_id, v_db_img_id);
          END IF;
        END LOOP;
      END IF;
    END LOOP;
  END IF;

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error updating product %: %', p_product_id, SQLERRM;
END;
$function$;