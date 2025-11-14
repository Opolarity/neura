-- Función para procesar confirmación de orden
CREATE OR REPLACE FUNCTION process_order_confirmation()
RETURNS TRIGGER AS $$
DECLARE
  v_status_code TEXT;
  v_previous_status_code TEXT;
  v_order_product RECORD;
BEGIN
  -- Obtener el código del status actual
  SELECT code INTO v_status_code
  FROM statuses
  WHERE id = NEW.status_id;

  -- Obtener el código del status anterior (si existe)
  SELECT s.code INTO v_previous_status_code
  FROM order_history oh
  JOIN statuses s ON s.id = oh.status_id
  WHERE oh.order_id = NEW.order_id
    AND oh.id != NEW.id
    AND oh.last_row = true;

  -- Si el nuevo status es CFM (confirmado) y el anterior era PND (pendiente)
  IF v_status_code = 'CFM' AND (v_previous_status_code = 'PND' OR v_previous_status_code IS NULL) THEN
    -- Actualizar la columna last_row del registro anterior
    UPDATE order_history
    SET last_row = false
    WHERE order_id = NEW.order_id
      AND id != NEW.id
      AND last_row = true;

    -- Procesar cada producto de la orden
    FOR v_order_product IN
      SELECT op.id, op.product_variation_id, op.quantity, op.warehouses_id
      FROM order_products op
      WHERE op.order_id = NEW.order_id
    LOOP
      -- Actualizar reservation a false
      UPDATE order_products
      SET reservation = false
      WHERE id = v_order_product.id;

      -- Descontar del stock
      UPDATE product_stock
      SET stock = stock - v_order_product.quantity
      WHERE product_variation_id = v_order_product.product_variation_id
        AND warehouse_id = v_order_product.warehouses_id;
    END LOOP;

    RAISE NOTICE 'Order % confirmed and stock updated', NEW.order_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para ejecutar la función cuando se inserta en order_history
CREATE TRIGGER trigger_process_order_confirmation
  AFTER INSERT ON order_history
  FOR EACH ROW
  EXECUTE FUNCTION process_order_confirmation();