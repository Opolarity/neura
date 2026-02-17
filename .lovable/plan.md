

## Actualizar creacion de comprobantes al nuevo esquema de `invoices`

La tabla `invoices` ya no tiene `account_id` ni `serie`. Ahora tiene campos de cliente directo y campos fiscales. Se necesitan actualizar 3 archivos:

---

### 1. Tipos (`src/modules/invoices/types/Invoices.types.ts`)

**`CreateInvoicePayload`** - Reemplazar `serie` y `account_id` por los nuevos campos:
- `tax_serie` (string, opcional) - reemplaza `serie`
- `customer_document_type_id` (number) - nuevo
- `customer_document_number` (string) - nuevo
- `client_name` (string, opcional) - nuevo
- `client_email` (string, opcional) - nuevo
- `client_address` (string, opcional) - nuevo
- `total_taxes` (number, opcional) - nuevo
- `total_free` (number, opcional) - nuevo
- `total_others` (number, opcional) - nuevo
- Eliminar: `serie`, `account_id`

**`InvoiceFormData`** - Ajustar campos:
- Reemplazar `serie` por `taxSerie`
- Eliminar `accountId`
- Agregar `clientEmail` y `clientAddress` (opcionales)

---

### 2. Edge Function (`supabase/functions/create-invoice/index.ts`)

Actualizar el insert de la linea 46-52 para usar los nuevos campos:

```typescript
.insert({
  invoice_type_id: input.invoice_type_id,
  tax_serie: input.tax_serie || null,
  customer_document_type_id: input.customer_document_type_id || 0,
  customer_document_number: input.customer_document_number || ' ',
  client_name: input.client_name || null,
  client_email: input.client_email || null,
  client_address: input.client_address || null,
  total_amount: input.total_amount,
  total_taxes: input.total_taxes || null,
  total_free: input.total_free || null,
  total_others: input.total_others || null,
  created_by: user.id,
})
```

---

### 3. Hook `useCreateInvoice` (`src/modules/invoices/hooks/useCreateInvoice.ts`)

- **INITIAL_FORM**: Reemplazar `serie` por `taxSerie`, eliminar `accountId`, agregar `clientEmail: ""` y `clientAddress: ""`
- **Validacion en `handleSave`**: Ya no exigir `accountId`. En su lugar validar que `documentTypeId` y `clientDocument` esten completos
- **Payload en `handleSave`**: Construir con los nuevos campos:

```typescript
await createInvoiceApi({
  invoice_type_id: parseInt(formData.invoiceTypeId),
  tax_serie: formData.taxSerie || undefined,
  customer_document_type_id: parseInt(formData.documentTypeId) || 0,
  customer_document_number: formData.clientDocument,
  client_name: formData.clientName || undefined,
  client_email: formData.clientEmail || undefined,
  client_address: formData.clientAddress || undefined,
  total_amount: totalAmount,
  total_taxes: +items.reduce((s, i) => s + i.igv, 0).toFixed(2),
  items: items.map(...)
});
```

- **`searchClient`**: Mantener la busqueda hibrida pero ya no guardar `accountId` (solo se usa para obtener el nombre del cliente)

---

### 4. Formulario `CreateInvoice.tsx`

- Renombrar campo "Serie" a "Serie Tributaria" (mapea a `taxSerie`)
- Agregar campos opcionales de email y direccion del cliente
- Eliminar cualquier referencia a `accountId` en la UI

