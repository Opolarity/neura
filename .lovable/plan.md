

## Respuesta: Sí funciona desde `/sales/create`

Desde `/sales/create` y `/sales/edit`, al imprimir un comprobante se usa la ruta `/invoices/print/:id` que corresponde a `InvoicePrintPage.tsx`. Este componente **ya tiene** la lógica de obtener el logo desde `parameters` con `InvoiceLogoUrl` para comprobantes declarados.

### Lo que NO tiene la lógica es el POS

Desde el POS (`/pos/open`), al imprimir se usa `/pos/ticket/:id` → `POSTicketPrintPage.tsx`, que tiene el logo hardcodeado a `/images/logo-ticket.png`. Si quieres que el POS también use el logo dinámico para comprobantes declarados, habría que replicar la misma lógica ahí.

### Plan (solo si quieres corregir el POS)

En `POSTicketPrintPage.tsx`:
1. Agregar query a `parameters` para obtener `InvoiceLogoUrl` junto con las demás queries iniciales
2. Usar `invoiceLogoUrl` cuando `invoice.declared === true`, sino el logo default

Es el mismo patrón que ya se aplicó en `InvoicePrintPage.tsx`.

