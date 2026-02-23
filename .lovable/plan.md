

## Validaciones y mapeo de datos al crear comprobantes (non-INV) desde el modal de ventas

### Resumen
Cuando se selecciona un tipo de comprobante cuyo code NO sea "INV", el sistema debe aplicar validaciones de negocio antes de crear el comprobante, y mapear correctamente campos adicionales como `vinculated_invoice_id`, `customer_document_estate_code`, serie e `invoice_number`.

---

### Reglas de validación (solo para code distinto de "INV")

1. **No duplicar tipo**: No puede existir otro comprobante del mismo `invoice_type_id` ya vinculado a la orden.
2. **Exclusividad entre code 1 y 2**: Si ya existe un comprobante con code "1" o "2", no se puede crear otro de code "1" ni "2".
3. **Dependencia para code 3 y 4**: Solo se puede crear un comprobante con code "3" o "4" si ya existe uno con code "1" o "2" vinculado a la orden.
4. **Pago completo (incluyendo negativos)**: La suma de `order_payment.amount` (positivos y negativos) debe ser exactamente igual al total de la orden.

---

### Mapeo de campos adicionales

| Campo | Lógica |
|---|---|
| `vinculated_invoice_id` | Solo para code "3" o "4": se vincula al `id` del invoice existente con code "1" o "2" |
| `tax_serie` | Code "1" -> `serie` de `factura_serie_id` del sale_type. Code "2" -> `serie` de `boleta_serie_id`. Code "3"/"4" -> depende del tipo del invoice vinculado: si es tipo "1" usa `factura_serie_id`, si es tipo "2" usa `boleta_serie_id` |
| `customer_document_estate_code` | Valor de `state_code` de `document_types` donde `id = order.document_type` |
| `invoice_number` | Siempre `null` |

---

### Cambios técnicos

**Archivo**: `src/modules/sales/components/SalesInvoicesModal.tsx`

1. **Refactorizar el flujo de confirmación** para que, al hacer click en un tipo non-INV, antes de mostrar el AlertDialog se ejecuten las validaciones. Si alguna falla, se muestra un toast con el error y no se abre el diálogo.

2. **Nueva función `validateNonInvInvoice`**:
   - Recibe el `invoiceType` seleccionado y la lista de `invoices` ya cargados (que incluyen `invoice_type_id`).
   - Consulta los `types` (invoice types) para obtener los codes de los invoices existentes.
   - Aplica las 4 reglas de validación.
   - Retorna `{ valid: boolean, error?: string, vinculatedInvoice?: Invoice }`.

3. **Refactorizar `getSerieForType`**:
   - Para code "3" o "4": recibir el tipo del invoice vinculado (code "1" o "2") y usar `factura_serie_id` o `boleta_serie_id` respectivamente.

4. **Refactorizar `handleCreateInvoice`**:
   - Obtener `state_code` de `document_types` usando `order.document_type`.
   - Enviar `customer_document_estate_code` al body del edge function.
   - Enviar `vinculated_invoice_id` cuando aplique (code "3"/"4").
   - Enviar `invoice_number: null` siempre.

5. **Actualizar `create-invoice` edge function**: Agregar `customer_document_estate_code` y `vinculated_invoice_id` al INSERT de la tabla `invoices` (verificar que ya los acepta del input, solo falta mapearlos).

