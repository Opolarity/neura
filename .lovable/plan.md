

## Cambios en el Modal de Comprobantes Vinculados

### Resumen
Se agregaran columnas de "N. Comprobante" y "Acciones" al listado de comprobantes vinculados, con botones de "Emitir" y "Ver" para los comprobantes no-INV que no han sido declarados. Al hacer click en "Emitir", se mostrara un AlertDialog de confirmacion que ejecutara la misma logica existente (`emit-invoice` edge function). Tambien se ampliara el ancho del modal.

---

### Cambios en `SalesInvoicesModal.tsx`

1. **Ampliar el modal**: Cambiar `sm:max-w-[600px]` a `sm:max-w-[900px]`.

2. **Agregar campo `declared` e `invoice_number` a la interfaz `Invoice`**:
   - `declared: boolean`
   - `invoice_number: string | null`

3. **Actualizar la query de invoices** para incluir `declared` e `invoice_number` en el `.select()`.

4. **Agregar columna "N. Comprobante"** despues de "Tipo" mostrando `inv.invoice_number || "-"`.

5. **Agregar columna "Acciones"** al final de la tabla:
   - Para comprobantes cuyo tipo NO sea "INV" (`code !== "INV"`) y `declared === false`: mostrar dos botones con iconos:
     - **Emitir** (icono `ArrowUp` de lucide-react): abre un AlertDialog de confirmacion.
     - **Ver** (icono `Eye` de lucide-react): funcionalidad existente de previsualizar.
   - Para los demas: mostrar "-".

6. **Nuevo estado `emittingInvoiceId`**: para controlar cual comprobante esta siendo emitido y mostrar loading.

7. **Nuevo AlertDialog para confirmar emision**:
   - Estado `pendingEmitInvoice` con el invoice seleccionado.
   - Mensaje: "Estas seguro de emitir este comprobante a la SUNAT?"
   - Al confirmar, invoca `supabase.functions.invoke("emit-invoice", { body: { invoice_id } })`.
   - Maneja la respuesta mostrando toast de exito o error.
   - Refresca la lista de comprobantes tras emision exitosa.

### Sin cambios en Edge Functions
La edge function `emit-invoice` ya maneja toda la logica de emision (obtiene datos del comprobante, items, proveedor/token via el RPC `sp_get_invoice_for_emit`, construye el payload NubeFact, y actualiza el resultado). Solo se necesita invocarla con el `invoice_id`.

