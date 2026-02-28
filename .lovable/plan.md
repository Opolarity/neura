

## Plan: Vista de Código de Barras con estructura completa del proyecto

### Archivos a crear

```text
src/modules/barcodes/
├── types/
│   └── Barcodes.types.ts        # Interfaces y tipos
├── services/
│   └── Barcodes.service.ts      # Llamadas a Supabase (queries + invoke edge function)
├── adapters/
│   └── Barcodes.adapter.ts      # Transformación de respuestas API
├── hooks/
│   └── useBarcodes.ts           # Hook principal con toda la lógica de estado
├── components/
│   └── BarcodeConfigModal.tsx   # Modal de configuración
├── pages/
│   └── BarcodesPage.tsx         # Página principal
├── routes.tsx                   # Definición de ruta /codigo-de-barras
└── index.ts                     # Exports

supabase/functions/create-barcode/
└── index.ts                     # Edge function para insert en bar_codes
```

### Archivos a modificar

- `src/app/routes/index.tsx` — agregar `barcodesRoutes`
- `supabase/config.toml` — agregar `[functions.create-barcode]`

### Paso 1: Edge Function `create-barcode`

Sigue el patrón de `create-stock-movements-entrance`:
- CORS headers
- Auth con `getUser(token)`
- Recibe body: `{ product_variation_id, price_list_id, stock_movement_id?, sequence, quantities }`
- Inserta en `bar_codes` con `created_by = user.id`
- Retorna el registro creado

### Paso 2: Types (`Barcodes.types.ts`)

```typescript
// Payload para crear barcode
interface CreateBarcodePayload {
  product_variation_id: number;
  price_list_id: number;
  stock_movement_id?: number | null;
  sequence: number;
  quantities: number;
}

// Variación con datos de producto para el select
interface VariationOption {
  variationId: number;
  sku: string;
  productTitle: string;
  terms: string; // "TALLA - M"
}

// Stock movement filtrado
interface StockMovementOption {
  id: number;
  label: string; // descripción o fecha
}

// Precio obtenido
interface VariationPrice {
  price: number;
  sale_price: number | null;
}
```

### Paso 3: Services (`Barcodes.service.ts`)

- `getVariationsForSelect()` — query `variations` + `products(title)` + `variation_terms(terms(name, term_groups(name)))` para armar el label
- `getStockMovementsByMER()` — obtener `module_id` de `modules` con `code=STM`, luego `type_id` de `types` con `code=MER`, luego `stock_movements` filtrados por ese `movement_type`
- `getPriceListActive()` — reutilizar `getPriceListIsActiveTrue` de shared/services
- `getNextSequence(product_variation_id)` — query `bar_codes` filtrando por variation, order desc, limit 1 → `max + 1` o `1`
- `getVariationPrice(product_variation_id, price_list_id)` — query `product_price` para obtener el precio
- `createBarcodeApi(payload)` — `supabase.functions.invoke("create-barcode", { method: "POST", body: payload })`

### Paso 4: Adapters (`Barcodes.adapter.ts`)

- `variationsAdapter` — transforma respuesta de supabase a `VariationOption[]`
- `stockMovementsAdapter` — transforma a `StockMovementOption[]`

### Paso 5: Hook (`useBarcodes.ts`)

Sigue el patrón de `useCreateMovements`:
- Estado para: variaciones, stock movements, price lists, selected values, sequence, quantity, loading, price
- `loadInitialData()` en `useEffect` — carga variaciones, stock movements MER, price lists activas
- `handleVariationChange(id)` — al seleccionar variación, calcula sequence automático
- `handlePriceListChange(id)` — al seleccionar, obtiene el precio para la variación+lista
- `handleSubmit()` — llama `createBarcodeApi`, luego genera PDF con jsPDF

### Paso 6: PDF Generation (dentro del hook o componente)

- jsPDF con formato `[30, 20]` mm (ancho x alto)
- Por cada página (cantidad de etiquetas):
  - Nombre del producto + variación (ej: "Vudú - Oversize")
  - Atributos (ej: "TALLA - M")
  - Código de barras visual generado con canvas (Code128 simple)
  - Precio (ej: "S/.69.0")
- Abrir PDF en nueva ventana

### Paso 7: Modal y Página

- `BarcodeConfigModal` — Dialog con formulario: producto (combobox), movimiento stock (select opcional), lista precio (select), lote (readonly), cantidad (input number)
- `BarcodesPage` — abre el modal automáticamente al montar

### Paso 8: Ruta

- Registrar en `routes/index.tsx` dentro de `ProtectedLayout.children`

### Dependencia externa

Se necesita instalar `jsbarcode` para generar códigos de barras visuales en canvas para el PDF.

