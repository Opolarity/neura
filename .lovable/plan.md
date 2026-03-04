

## Plan: Rediseñar el modal de creación de códigos de barras en `/bar-codes`

### Contexto actual

El modal `BarcodeConfigModal` usa campos `Select` básicos para producto y movimiento de stock. El servicio `getStockMovementsByMER` ya filtra por tipo MER pero trae datos limitados (sin nombre de producto ni usuario). El campo Lote es read-only.

### Cambios requeridos

#### 1. Nuevo componente: Buscador de Movimientos de Stock (campo opcional, va primero)

- Crear `StockMovementSearcher.tsx` -- un `Popover` + `Command` (similar al buscador de productos en `/sales/create`)
- Servicio: modificar `getStockMovementsByMER` para traer datos adicionales:
  - `product_variation_id`, variación (producto title, variation_terms, sku), `quantity`, `created_at`, `created_by` (perfil/nombre del usuario)
- Cada resultado se renderiza como una **card** dentro del `CommandList` mostrando:
  - Nombre del producto + variación (si es variable)
  - Cantidad del movimiento
  - Fecha
  - Usuario que creó
  - ID del movimiento
- Al seleccionar un movimiento:
  - Auto-rellenar el campo Producto con la variación vinculada y **bloquearlo** (disabled)
  - Auto-rellenar el campo Cantidad con la cantidad del movimiento pero **dejarlo editable**
  - Guardar el `selectedStockMovementId`
- Al limpiar la selección: desbloquear producto y limpiar cantidad

#### 2. Nuevo componente: Buscador de Productos (campo obligatorio, segundo)

- Crear `ProductVariationSearcher.tsx` -- `Popover` + `Command` con búsqueda por texto
- Servicio: reutilizar/adaptar `getVariationsForSelect` para traer todas las variaciones con: producto title, variation_terms (nombre variación), SKU, stock_type (tipo de inventario)
- Mostrar en cada item: nombre producto, variación si aplica, SKU, tipo de inventario
- Este campo se bloquea si hay un movimiento de stock seleccionado

#### 3. Modificar campo Lote

- Cambiar de `readOnly + disabled` a **editable** (quitar `readOnly` y `disabled`, quitar `bg-muted`)
- Seguir calculando el valor automáticamente al cambiar variación, pero el usuario puede modificarlo

#### 4. Actualizar `useBarcodes` hook

- Añadir estado para "locked by movement" (producto bloqueado)
- Nuevo handler `handleStockMovementChange` que:
  - Busca la variación vinculada al movimiento
  - Setea `selectedVariationId` y dispara cálculo de sequence
  - Setea `quantities` con la cantidad del movimiento
  - Marca el campo producto como bloqueado
- Añadir `setSequence` al return para permitir edición manual del lote

#### 5. Actualizar `BarcodeConfigModal`

- Reordenar campos: Movimiento de Stock -> Producto -> Lista de Precio -> Lote -> Cantidad
- Reemplazar los `Select` de movimiento y producto por los nuevos componentes buscadores
- Pasar prop `disabled` al buscador de producto cuando hay movimiento seleccionado

#### 6. Tipos

- Ampliar `StockMovementOption` con campos adicionales: `productVariationId`, `productTitle`, `variationTerms`, `quantity`, `createdAt`, `userName`

### Archivos a modificar/crear

| Archivo | Acción |
|---|---|
| `src/modules/barcodes/components/StockMovementSearcher.tsx` | Crear |
| `src/modules/barcodes/components/ProductVariationSearcher.tsx` | Crear |
| `src/modules/barcodes/components/BarcodeConfigModal.tsx` | Modificar (reordenar campos, usar nuevos componentes) |
| `src/modules/barcodes/hooks/useBarcodes.ts` | Modificar (nuevo handler movimiento, lote editable) |
| `src/modules/barcodes/services/Barcodes.service.ts` | Modificar (ampliar queries) |
| `src/modules/barcodes/adapters/Barcodes.adapter.ts` | Modificar (adapter movimientos con más datos) |
| `src/modules/barcodes/types/Barcodes.types.ts` | Modificar (ampliar StockMovementOption) |

