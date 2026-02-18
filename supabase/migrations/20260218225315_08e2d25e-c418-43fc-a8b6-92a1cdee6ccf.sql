
CREATE OR REPLACE FUNCTION public.sp_update_product(
  p_product_id         INTEGER,
  p_product_name       TEXT,
  p_short_description  TEXT,
  p_description        TEXT,
  p_is_variable        BOOLEAN,
  p_is_active          BOOLEAN,
  p_is_web             BOOLEAN,
  p_selected_categories INTEGER[],
  p_product_images     JSONB,
  p_variations         JSONB,
  p_reset_variations   BOOLEAN,
  p_user_id            UUID,
  OUT o_image_id_map     JSONB,
  OUT o_images_to_delete JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_default_stock_type_id  INTEGER;
  v_manual_movement_type   INTEGER;

  -- imágenes
  v_img                    JSONB;
  v_existing_image_ids     INTEGER[];
  v_img_record             RECORD;
  v_inserted_image_id      INTEGER;
  v_image_id_map           JSONB := '{}';
  v_images_to_delete       JSONB := '[]';

  -- variaciones
  v_variation              JSONB;
  v_existing_var           RECORD;
  v_new_var_id             INTEGER;
  v_sku                    TEXT;
  v_attr                   JSONB;
  v_price                  JSONB;
  v_stock                  JSONB;
  v_sel_img                TEXT;
  v_db_img_id              INTEGER;

  -- normal mode helpers
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

  -- ── 1. Tipos de referencia ────────────────────────────────
  SELECT id INTO v_default_stock_type_id FROM types WHERE code = 'PRD' LIMIT 1;

  SELECT t.id INTO v_manual_movement_type
  FROM   types t
  JOIN   modules m ON m.id = t.module_id
  WHERE  t.code = 'MAN' AND m.code = 'STM'
  LIMIT  1;

  -- ── 2. Datos básicos del producto ─────────────────────────
  UPDATE products SET
    title             = p_product_name,
    short_description = p_short_description,
    description       = p_description,
    is_variable       = p_is_variable,
    active            = p_is_active,
    web               = p_is_web
  WHERE id = p_product_id;

  -- ── 3. Categorías ─────────────────────────────────────────
  DELETE FROM product_categories WHERE product_id = p_product_id;

  IF array_length(p_selected_categories, 1) > 0 THEN
    INSERT INTO product_categories (product_id, category_id)
    SELECT p_product_id, unnest(p_selected_categories);
  END IF;

  -- ── 4. Imágenes ───────────────────────────────────────────
  SELECT ARRAY(
    SELECT REPLACE(img->>'id', 'existing-', '')::INTEGER
    FROM   jsonb_array_elements(p_product_images) img
    WHERE  img->>'id' LIKE 'existing-%'
  ) INTO v_existing_image_ids;

  SELECT jsonb_agg(pi.image_url)
  INTO   v_images_to_delete
  FROM   product_images pi
  WHERE  pi.product_id = p_product_id
    AND  (v_existing_image_ids IS NULL OR pi.id <> ALL(v_existing_image_ids));

  DELETE FROM product_images WHERE product_id = p_product_id;

  FOR v_img IN SELECT * FROM jsonb_array_elements(p_product_images)
  LOOP
    INSERT INTO product_images (product_id, image_url, image_order)
    VALUES (
      p_product_id,
      v_img->>'path',
      (v_img->>'order')::INTEGER
    )
    RETURNING id INTO v_inserted_image_id;

    v_image_id_map := v_image_id_map || jsonb_build_object(
      v_img->>'id',
      v_inserted_image_id
    );
  END LOOP;

  o_image_id_map     := v_image_id_map;
  o_images_to_delete := COALESCE(v_images_to_delete, '[]'::JSONB);

  -- ── 5. Validaciones previas de variaciones ────────────────

  IF EXISTS (
    SELECT 1
    FROM   jsonb_array_elements(p_variations) v,
           jsonb_array_elements(v->'prices')  p
    WHERE  (p->>'price')      IS NOT NULL AND (p->>'price')::NUMERIC      < 0
        OR (p->>'sale_price') IS NOT NULL AND (p->>'sale_price')::NUMERIC < 0
  ) THEN
    RAISE EXCEPTION 'Los precios no pueden ser negativos.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM   jsonb_array_elements(p_variations) v,
           jsonb_array_elements(v->'stock')   s
    WHERE  (s->>'stock') IS NOT NULL AND (s->>'stock')::NUMERIC < 0
  ) THEN
    RAISE EXCEPTION 'El stock no puede ser negativo.';
  END IF;

  -- ── 6. Variaciones ────────────────────────────────────────

  IF p_reset_variations THEN
    -- ── 6a. RESET MODE ───────────────────────────────────────
    UPDATE variations
    SET    is_active = FALSE
    WHERE  product_id = p_product_id AND is_active = TRUE;

    FOR v_variation IN SELECT * FROM jsonb_array_elements(p_variations)
    LOOP
      INSERT INTO variations (product_id, sku, is_active)
      VALUES (p_product_id, NULL, TRUE)
      RETURNING id INTO v_new_var_id;

      v_sku := '100' || LPAD(p_product_id::TEXT, 5, '0') || LPAD(v_new_var_id::TEXT, 4, '0');
      UPDATE variations SET sku = v_sku WHERE id = v_new_var_id;

      INSERT INTO variation_terms (product_variation_id, term_id)
      SELECT v_new_var_id, (attr->>'term_id')::INTEGER
      FROM   jsonb_array_elements(v_variation->'attributes') attr;

      INSERT INTO product_price (product_variation_id, price_list_id, price, sale_price)
      SELECT
        v_new_var_id,
        (p->>'price_list_id')::INTEGER,
        COALESCE((p->>'price')::NUMERIC, 0),
        CASE WHEN p->>'sale_price' IS NOT NULL THEN (p->>'sale_price')::NUMERIC ELSE NULL END
      FROM jsonb_array_elements(v_variation->'prices') p
      WHERE (p->>'price')::NUMERIC > 0
         OR ((p->>'sale_price') IS NOT NULL AND (p->>'sale_price')::NUMERIC > 0);

      FOR v_stock IN SELECT * FROM jsonb_array_elements(v_variation->'stock')
      LOOP
        IF (v_stock->>'stock')::NUMERIC > 0 THEN
          v_stock_type_id := COALESCE((v_stock->>'stock_type_id')::INTEGER, v_default_stock_type_id);

          INSERT INTO product_stock (product_variation_id, warehouse_id, stock, stock_type_id)
          VALUES (
            v_new_var_id,
            (v_stock->>'warehouse_id')::INTEGER,
            (v_stock->>'stock')::NUMERIC,
            v_stock_type_id
          );

          IF v_manual_movement_type IS NOT NULL THEN
            INSERT INTO stock_movements
              (product_variation_id, quantity, created_by, movement_type,
               warehouse_id, completed, stock_type_id, is_active)
            VALUES (
              v_new_var_id,
              (v_stock->>'stock')::NUMERIC,
              p_user_id,
              v_manual_movement_type,
              (v_stock->>'warehouse_id')::INTEGER,
              TRUE,
              v_stock_type_id,
              TRUE
            );
          END IF;
        END IF;
      END LOOP;

      FOR v_sel_img IN SELECT jsonb_array_elements_text(v_variation->'selectedImages')
      LOOP
        v_db_img_id := (v_image_id_map->>v_sel_img)::INTEGER;
        IF v_db_img_id IS NOT NULL THEN
          INSERT INTO product_variation_images (product_variation_id, product_image_id)
          VALUES (v_new_var_id, v_db_img_id);
        END IF;
      END LOOP;

    END LOOP;

  ELSE
    -- ── 6b. NORMAL MODE ──────────────────────────────────────

    CREATE TEMP TABLE _existing_vars ON COMMIT DROP AS
    SELECT
      v.id,
      v.sku,
      COALESCE(
        STRING_AGG(vt.term_id::TEXT, ',' ORDER BY vt.term_id),
        '__no_terms__'
      ) AS term_key
    FROM   variations v
    LEFT JOIN variation_terms vt ON vt.product_variation_id = v.id
    WHERE  v.product_id = p_product_id AND v.is_active = TRUE
    GROUP BY v.id, v.sku;

    CREATE TEMP TABLE _incoming_vars ON COMMIT DROP AS
    SELECT
      idx::INTEGER AS pos,
      var AS data,
      COALESCE(
        (
          SELECT STRING_AGG(a->>'term_id', ',' ORDER BY (a->>'term_id')::INTEGER)
          FROM   jsonb_array_elements(var->'attributes') a
        ),
        '__no_terms__'
      ) AS term_key
    FROM   jsonb_array_elements(p_variations) WITH ORDINALITY AS t(var, idx);

    -- Variaciones a eliminar
    SELECT ARRAY(
      SELECT e.id
      FROM   _existing_vars e
      LEFT JOIN _incoming_vars i ON i.term_key = e.term_key
      WHERE  i.term_key IS NULL
    ) INTO v_to_delete_ids;

    -- Validar que no están en pedidos
    IF array_length(v_to_delete_ids, 1) > 0 THEN
      SELECT COUNT(*) INTO v_linked_count
      FROM   order_products
      WHERE  product_variation_id = ANY(v_to_delete_ids);

      IF v_linked_count > 0 THEN
        RAISE EXCEPTION 'No se pueden eliminar variaciones vinculadas a pedidos existentes. '
          'Las variaciones que está intentando eliminar están asociadas a uno o más pedidos. '
          'Por favor, conserve los términos actuales o agregue nuevos sin eliminar los existentes.';
      END IF;
    END IF;

    -- ── UPDATE de variaciones existentes ─────────────────────
    FOR v_pair IN
      SELECT e.id AS existing_id, i.data AS incoming
      FROM   _existing_vars e
      JOIN   _incoming_vars i ON i.term_key = e.term_key
    LOOP
      DELETE FROM product_price WHERE product_variation_id = v_pair.existing_id;

      INSERT INTO product_price (product_variation_id, price_list_id, price, sale_price)
      SELECT
        v_pair.existing_id,
        (p->>'price_list_id')::INTEGER,
        COALESCE((p->>'price')::NUMERIC, 0),
        CASE WHEN p->>'sale_price' IS NOT NULL THEN (p->>'sale_price')::NUMERIC ELSE NULL END
      FROM jsonb_array_elements(v_pair.incoming->'prices') p
      WHERE (p->>'price') IS NOT NULL OR (p->>'sale_price') IS NOT NULL;

      FOR v_stock IN SELECT * FROM jsonb_array_elements(v_pair.incoming->'stock')
      LOOP
        v_stock_type_id := COALESCE((v_stock->>'stock_type_id')::INTEGER, v_default_stock_type_id);
        v_new_qty := COALESCE((v_stock->>'stock')::NUMERIC, 0);

        SELECT stock INTO v_old_qty
        FROM   product_stock
        WHERE  product_variation_id = v_pair.existing_id
          AND  warehouse_id  = (v_stock->>'warehouse_id')::INTEGER
          AND  stock_type_id = v_stock_type_id
        LIMIT 1;

        v_old_qty    := COALESCE(v_old_qty, 0);
        v_difference := v_new_qty - v_old_qty;

        IF FOUND THEN
          UPDATE product_stock
          SET    stock = v_new_qty
          WHERE  product_variation_id = v_pair.existing_id
            AND  warehouse_id         = (v_stock->>'warehouse_id')::INTEGER
            AND  stock_type_id        = v_stock_type_id;
        ELSIF v_new_qty > 0 THEN
          INSERT INTO product_stock (product_variation_id, warehouse_id, stock, stock_type_id)
          VALUES (v_pair.existing_id, (v_stock->>'warehouse_id')::INTEGER, v_new_qty, v_stock_type_id);
        END IF;

        IF v_difference <> 0 AND v_manual_movement_type IS NOT NULL THEN
          INSERT INTO stock_movements
            (product_variation_id, quantity, created_by, movement_type,
             warehouse_id, completed, stock_type_id, is_active)
          VALUES (
            v_pair.existing_id, v_difference, p_user_id, v_manual_movement_type,
            (v_stock->>'warehouse_id')::INTEGER, TRUE, v_stock_type_id, TRUE
          );
        END IF;
      END LOOP;

      DELETE FROM product_variation_images WHERE product_variation_id = v_pair.existing_id;

      FOR v_sel_img IN SELECT jsonb_array_elements_text(v_pair.incoming->'selectedImages')
      LOOP
        v_db_img_id := (v_image_id_map->>v_sel_img)::INTEGER;
        IF v_db_img_id IS NOT NULL THEN
          INSERT INTO product_variation_images (product_variation_id, product_image_id)
          VALUES (v_pair.existing_id, v_db_img_id);
        END IF;
      END LOOP;

    END LOOP;

    -- ── CREATE variaciones nuevas ─────────────────────────────
    FOR v_variation IN
      SELECT i.data
      FROM   _incoming_vars i
      LEFT JOIN _existing_vars e ON e.term_key = i.term_key
      WHERE  e.id IS NULL
    LOOP
      INSERT INTO variations (product_id, sku, is_active)
      VALUES (p_product_id, NULL, TRUE)
      RETURNING id INTO v_new_var_id;

      v_sku := '100' || LPAD(p_product_id::TEXT, 5, '0') || LPAD(v_new_var_id::TEXT, 4, '0');
      UPDATE variations SET sku = v_sku WHERE id = v_new_var_id;

      INSERT INTO variation_terms (product_variation_id, term_id)
      SELECT v_new_var_id, (attr->>'term_id')::INTEGER
      FROM   jsonb_array_elements(v_variation->'attributes') attr;

      INSERT INTO product_price (product_variation_id, price_list_id, price, sale_price)
      SELECT
        v_new_var_id,
        (p->>'price_list_id')::INTEGER,
        COALESCE((p->>'price')::NUMERIC, 0),
        CASE WHEN p->>'sale_price' IS NOT NULL THEN (p->>'sale_price')::NUMERIC ELSE NULL END
      FROM jsonb_array_elements(v_variation->'prices') p
      WHERE ((p->>'price')::NUMERIC > 0)
         OR ((p->>'sale_price') IS NOT NULL AND (p->>'sale_price')::NUMERIC > 0);

      FOR v_stock IN SELECT * FROM jsonb_array_elements(v_variation->'stock')
      LOOP
        IF (v_stock->>'stock')::NUMERIC > 0 THEN
          v_stock_type_id := COALESCE((v_stock->>'stock_type_id')::INTEGER, v_default_stock_type_id);

          INSERT INTO product_stock (product_variation_id, warehouse_id, stock, stock_type_id)
          VALUES (
            v_new_var_id,
            (v_stock->>'warehouse_id')::INTEGER,
            (v_stock->>'stock')::NUMERIC,
            v_stock_type_id
          );

          IF v_manual_movement_type IS NOT NULL THEN
            INSERT INTO stock_movements
              (product_variation_id, quantity, created_by, movement_type,
               warehouse_id, completed, stock_type_id, is_active)
            VALUES (
              v_new_var_id,
              (v_stock->>'stock')::NUMERIC,
              p_user_id,
              v_manual_movement_type,
              (v_stock->>'warehouse_id')::INTEGER,
              TRUE,
              v_stock_type_id,
              TRUE
            );
          END IF;
        END IF;
      END LOOP;

      FOR v_sel_img IN SELECT jsonb_array_elements_text(v_variation->'selectedImages')
      LOOP
        v_db_img_id := (v_image_id_map->>v_sel_img)::INTEGER;
        IF v_db_img_id IS NOT NULL THEN
          INSERT INTO product_variation_images (product_variation_id, product_image_id)
          VALUES (v_new_var_id, v_db_img_id);
        END IF;
      END LOOP;

    END LOOP;

    -- ── DELETE variaciones seguras ────────────────────────────
    IF array_length(v_to_delete_ids, 1) > 0 THEN
      DELETE FROM product_variation_images WHERE product_variation_id = ANY(v_to_delete_ids);
      DELETE FROM product_price            WHERE product_variation_id = ANY(v_to_delete_ids);
      DELETE FROM product_stock            WHERE product_variation_id = ANY(v_to_delete_ids);
      DELETE FROM variation_terms          WHERE product_variation_id = ANY(v_to_delete_ids);
      DELETE FROM variations               WHERE id = ANY(v_to_delete_ids);
    END IF;

  END IF;

END;
$$;
