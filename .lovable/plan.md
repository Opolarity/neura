

## Error: `column "movement_type_id" of relation "stock_movements" does not exist`

### Causa

La migración reciente recreó `sp_create_order` y en la línea 169 del INSERT a `stock_movements` usa la columna `movement_type_id`. Pero la tabla `stock_movements` tiene la columna como **`movement_type`**, no `movement_type_id`.

Columnas reales de `stock_movements`:
- `id`, `product_variation_id`, `quantity`, `created_by`, `created_at`, **`movement_type`**, `warehouse_id`, `completed`, `stock_type_id`, `vinculated_movement_id`, `is_active`

### Corrección

Crear una migración que recree `sp_create_order` cambiando solo la línea 169:

```sql
-- Línea actual (incorrecta):
movement_type_id,

-- Corregir a:
movement_type,
```

Una sola línea en el INSERT de `stock_movements` (línea 169 del RPC). Todo lo demás queda igual.

