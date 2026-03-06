

## Diagnostico

`InvoicePrintPage.tsx` tiene dos problemas:

1. **No incluye `qr_data`** en la interfaz `InvoiceData` ni en el query SELECT (linea 125)
2. **No genera ni renderiza el QR** en el PDF — no importa `qrcode`, no tiene logica de QR

En contraste, `POSTicketPrintPage.tsx` ya tiene todo esto implementado correctamente.

## Solucion

Replicar la logica de QR del POS ticket en el invoice print page:

### 1. Agregar `qr_data` a la interfaz y query
- Agregar `qr_data: string | null` a `InvoiceData` (linea 22)
- Agregar `qr_data` al SELECT de la query (linea 125)

### 2. Importar la libreria `qrcode`
- Agregar `import QRCode from "qrcode"` junto a los otros imports

### 3. Generar el QR en el PDF
- Despues del footer (antes de abrir el PDF, ~linea 445), agregar la misma logica que tiene `POSTicketPrintPage.tsx`:
  - Si `invoice.qr_data` existe, generar el QR con `QRCode.toDataURL`
  - Insertar la imagen QR centrada en el PDF

### Archivos a modificar
- `src/modules/invoices/pages/InvoicePrintPage.tsx`

