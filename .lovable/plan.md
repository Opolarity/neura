

## Plan: Listado de Códigos de Barras en `/bar-codes`

### Situacion actual
La página `/bar-codes` solo muestra un botón "Nuevo Código" y abre directamente el modal de configuración. No hay listado de registros existentes.

### Cambios propuestos

**1. Nuevo servicio: `fetchBarcodesList`** en `Barcodes.service.ts`
- Query a `bar_codes` con joins a `variations` (+ `products`), `price_list`, y opcionalmente `stock_movements`
- Traer: id, sequence, quantities, created_at, producto (title), SKU, lista de precios (name)
- Ordenado por `created_at DESC`

**2. Nuevo tipo `BarcodeListItem`** en `Barcodes.types.ts`
- id, productTitle, sku, priceListName, sequence, quantities, createdAt

**3. Nuevo adapter `barcodeListAdapter`** en `Barcodes.adapter.ts`
- Transforma el raw data del query al tipo `BarcodeListItem`

**4. Nuevo componente `BarcodeListTable`**
- Tabla con columnas: ID, Producto, SKU, Lista de Precio, Lote, Cantidad, Fecha
- Acción para re-imprimir el PDF (icono de impresora)
- Estado de carga con spinner overlay (mismo patrón de Sales)

**5. Actualizar `useBarcodes` hook**
- Agregar estado `barcodeList` y `listLoading`
- Cargar lista al montar y después de cada creación exitosa (refresh)

**6. Actualizar `BarcodesPage`**
- Mostrar la tabla de listado como contenido principal
- El botón "Nuevo Código" sigue abriendo el modal
- Tras generar un barcode, se refresca la lista

### Flujo del usuario
1. Entra a `/bar-codes` → ve la tabla con todos los códigos generados
2. Puede hacer click en "Nuevo Código" → abre modal → genera → lista se actualiza
3. Puede re-imprimir desde la tabla

