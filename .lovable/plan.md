

## Cambios necesarios por reestructuración de `stock_movement_requests`

### Contexto
Las columnas `reason`, `module_id`, `status_id`, `situation_id` y `last_message` fueron eliminadas de `stock_movement_requests`. Ahora esa información vive en `stock_movement_request_situations` con las columnas: `message`, `module_id`, `status_id`, `situation_id`, `warehouse_id`, `last_row`.

La tabla `stock_movement_requests` ahora solo tiene: `id`, `created_by`, `out_warehouse_id`, `in_warehouse_id`, `created_at`, `updated_at`.

### Plan de cambios

**1. Actualizar la Edge Function `create-stock-movements-request`**
- Remover `reason`, `module_id`, `status_id`, `situation_id` del INSERT a `stock_movement_requests` (ya no existen esas columnas).
- Solo insertar: `created_by`, `out_warehouse_id`, `in_warehouse_id`.
- En el INSERT a `stock_movement_request_situations`, agregar `warehouse_id: in_warehouse_id` (el almacen del usuario que crea la solicitud).
- El campo `message` ya se usa para guardar el motivo ("Request Created" actualmente), cambiarlo para usar el `reason` del payload.

**2. Actualizar tipos frontend (`MovementRequests.types.ts`)**
- `MovementRequestPayload`: se mantiene igual (el frontend sigue enviando los mismos datos, la edge function resuelve).
- `MovementRequestApiResponse`: actualizar el shape de `request` para reflejar la tabla actual (sin `reason`, `module_id`, `status_id`, `situation_id`). Solo: `id`, `created_by`, `out_warehouse_id`, `in_warehouse_id`, `created_at`, `updated_at`.

**3. Actualizar adapter (`MovementRequests.adapter.ts`)**
- Remover `reason` del mapeo (ya no viene en la respuesta del request).

**4. Hook `useCreateMovementRequest.ts`**
- Sin cambios de lógica significativos; el payload que envía ya incluye `reason` y los codes, la edge function se encarga del resto.

### Archivos a modificar
- `supabase/functions/create-stock-movements-request/index.ts` — actualizar insert a tabla sin columnas eliminadas, agregar `warehouse_id` al insert de situations, usar `reason` como `message`.
- `src/modules/inventory/types/MovementRequests.types.ts` — actualizar `MovementRequestApiResponse`.
- `src/modules/inventory/adapters/MovementRequests.adapter.ts` — remover campos eliminados.

