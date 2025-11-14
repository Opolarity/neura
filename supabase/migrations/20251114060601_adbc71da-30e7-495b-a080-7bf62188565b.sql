-- Eliminar registros relacionados a las órdenes 1 y 2
DELETE FROM oder_notes WHERE order_id IN (1, 2);
DELETE FROM order_history WHERE order_id IN (1, 2);
DELETE FROM order_payment WHERE order_id IN (1, 2);
DELETE FROM order_products WHERE order_id IN (1, 2);
DELETE FROM order_status WHERE order_id IN (1, 2);
DELETE FROM invoice WHERE order_id IN (1, 2);

-- Eliminar movimientos relacionados (asumiendo que la descripción contiene "Orden #1" o "Orden #2")
DELETE FROM movements WHERE description LIKE '%Orden #1%' OR description LIKE '%Orden #2%';

-- Finalmente eliminar las órdenes
DELETE FROM orders WHERE id IN (1, 2);