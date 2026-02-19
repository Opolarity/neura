## Boton "Crear" comprobante en el modal de ventas con asignacion automatica de serie

### Objetivo

Agregar un boton dropdown "Crear" en el modal de comprobantes vinculados (`SalesInvoicesModal`) que permita generar comprobantes desde la orden. El boton solo se habilitara cuando la orden este pagada al 100%, es decir la suma de los order_payment es exactamente igual al total de la orden. Al crear el comprobante, el sistema asignara automaticamente la serie correspondiente usando la tabla `sale_type_invoice_series`.  
  
NOTA: Antes de comenzar revisar de nuevo las tablas invoices, invoice_items, `sale_type_invoice_series` , invoice_series e invoice_providers ya que han dufrido cambios.

### Cambios necesarios

#### 1. SalesInvoicesModal - Agregar boton "Crear" con dropdown

**Archivo:** `src/modules/sales/components/SalesInvoicesModal.tsx`

- Recibir nuevas props: `orderTotal` (monto total de la orden) y `saleTypeId` (tipo de canal de venta de la orden)
- Al abrir el modal, consultar `order_payment` para sumar los pagos y determinar si esta 100% cancelada, es decir la suma de sus pagos es exactamente igual al total, no más, ni menos.
- Cargar los tipos de comprobante (tabla `types` con modulo `INV`)
- Mostrar un `DropdownMenu` con boton "Crear" alineado a la derecha en el header
- Si no esta pagada al 100%, el boton aparece deshabilitado
- Al seleccionar un tipo, ejecutar la logica de creacion del comprobante directamente desde el modal

#### 2. Logica de creacion con serie automatica

Cuando el usuario selecciona un tipo de comprobante del dropdown:

1. Consultar `sale_type_invoice_series` filtrando por `sale_type_id` de la orden para obtener el `tax_serie_id` (que referencia a `invoice_series`), hay posibilidad de que no lo encuentre.
2. Con el registro de `invoice_series` obtenido, seleccionar la columna de serie correcta segun las reglas:
  - **Factura** (code "1"): usar `fac_serie`
  - **Boleta** (code "2"): usar `bol_serie`
  - **Nota de credito** (code "3") o **Nota de debito** (code "4"): depende del comprobante vinculado (si esta vinculado a factura usar `fac_serie`, si a boleta usar `bol_serie`) -- para notas creadas desde ventas, esto no aplica directamente, asi que se omitira la serie por ahora para notas
  - Si no encuentra o no consigue el registro de `invoice_series` dejar el campo tax_serie en NULL
  - **Tipo comprobante** (code "INV") (columna code de la table types): automaticamente dejar tax_serie en NULL.
3. Construir el `tax_serie` con el valor de la columna correspondiente
4. Dejar la columna invoice_number como NULL (esa columna es nueva en invoices)
5. La columna declared de invoices colocarla como false.
6. Cargar datos del cliente y productos de la orden
7. Llamar a la edge function `create-invoice` con toda la informacion
8. Insertar el registro en `order_invoices` para vincular el comprobante con la orden
9. Refrescar la lista de comprobantes en el modal

#### 3. CreateSale - Pasar props adicionales al modal

**Archivo:** `src/modules/sales/pages/CreateSale.tsx`

- Pasar `orderTotal` y `saleTypeId` como props al componente `SalesInvoicesModal`

---

### Detalles tecnicos

**Flujo de obtencion de serie:**

```text
order.sale_type_id
    |
    v
sale_type_invoice_series (sale_type_id -> tax_serie_id)
    |
    v
invoice_series (id = tax_serie_id)
    |
    v
Segun tipo de comprobante:
  - Factura (code=1) -> fac_serie + "-" + next_number
  - Boleta (code=2)  -> bol_serie + "-" + next_number
```

**Datos del comprobante a crear:**

- `invoice_type_id`: ID del tipo seleccionado
- `tax_serie`: serie obtenida automaticamente o NULL
- invoice_number: NULL
- declared: false
- `customer_document_type_id` y `customer_document_number`: del `orders` (document_type, document_number)
- `client_name`: del `orders` (customer_name + customer_lastname)
- `total_amount`: total del orders
- total_taxes: calculo del total de orders menos el total de orders entre 1.18.
- Items: productos de `order_products` convertidos a items de comprobante

**Archivos a modificar:**

- `src/modules/sales/components/SalesInvoicesModal.tsx` (logica principal)
- `src/modules/sales/pages/CreateSale.tsx` (pasar props)
- `supabase/functions/create-invoice/index.ts` (agregar logica para vincular order_invoices y actualizar next_number)