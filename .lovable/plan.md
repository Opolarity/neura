

## Crear vista para agregar comprobantes (Invoices)

### Resumen
Se creara la pagina `/invoices/add` para crear comprobantes (invoices) con sus items, siguiendo la arquitectura existente del proyecto (types, services, adapters, hooks, pages).

### Estructura de datos

**Tabla `invoices`:**
- `id` (auto)
- `invoice_type_id` (bigint, requerido)
- `serie` (text, ej: "F003-233")
- `account_id` (bigint, requerido - cliente)
- `total_amount` (numeric, requerido)
- `declared` (boolean, default false)
- `created_by` (uuid, default auth.uid())
- `pdf_url`, `xml_url`, `cdr_url` (opcionales)

**Tabla `invoice_items`:**
- `id` (auto)
- `invoice_id` (bigint, requerido)
- `description` (text, requerido)
- `quantity` (numeric, requerido)
- `measurement_unit` (text, requerido)
- `unit_price` (numeric, requerido)
- `discount` (numeric, opcional)
- `igv` (numeric, requerido)
- `total` (numeric, requerido)

### Archivos a crear/modificar

#### 1. Tipos - `src/modules/invoices/types/Invoices.types.ts`
- Agregar interfaces: `InvoiceItem`, `CreateInvoicePayload`, `InvoiceFormData`

#### 2. Edge Function - `supabase/functions/create-invoice/index.ts`
- Recibe: datos del invoice + array de items
- Inserta en `invoices`, obtiene el ID, luego inserta los items en `invoice_items`
- Patron igual a `create-order`

#### 3. Servicio - `src/modules/invoices/services/Invoices.services.ts`
- Agregar funcion `createInvoiceApi` que invoque la edge function `create-invoice`

#### 4. Hook - `src/modules/invoices/hooks/useCreateInvoice.ts`
- Manejo de estado del formulario (datos del invoice, lista de items)
- Funciones: agregar item, eliminar item, actualizar item
- Calculo automatico de IGV (18%) y total por item
- Calculo del total general
- Funcion `handleSave` para enviar al backend

#### 5. Pagina - `src/modules/invoices/pages/CreateInvoice.tsx`
- **Seccion superior**: Datos del comprobante
  - Serie (input text)
  - Tipo de comprobante (invoice_type_id) - input numerico o select
  - Cliente (account_id) - buscador de clientes por documento
- **Seccion de items**: Tabla editable
  - Columnas: Descripcion, Cantidad, Unidad Medida, Precio Unitario, Descuento, IGV, Total
  - Boton "Agregar item" para anadir filas
  - Boton de eliminar por fila
  - IGV se calcula automaticamente (18% sobre base imponible)
  - Total por item = (cantidad * precio_unitario - descuento) + IGV
- **Resumen inferior**: Total general del comprobante
- **Botones**: Guardar / Cancelar (volver a `/invoices`)

#### 6. Rutas - `src/modules/invoices/routes.tsx`
- Agregar ruta `invoices/add` con el componente `CreateInvoice`

#### 7. Config - `supabase/config.toml`
- Agregar entrada para la nueva edge function `create-invoice`

### Seccion tecnica

**Calculo de items:**
```text
base = quantity * unit_price
base_con_descuento = base - (discount || 0)
igv = base_con_descuento * 0.18
total = base_con_descuento + igv
```

**Flujo de la edge function:**
1. Validar autenticacion
2. Insertar registro en `invoices` -> obtener `id`
3. Mapear items con el `invoice_id` obtenido
4. Insertar items en `invoice_items`
5. Retornar invoice creado

**RLS**: Las tablas `invoices` e `invoice_items` actualmente no tienen politicas RLS. La edge function usa `SERVICE_ROLE_KEY` asi que no se ve afectada. Se recomienda agregar RLS en el futuro pero no es bloqueante para esta implementacion.

