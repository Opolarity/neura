

## Plan: Ticket POS con QR de SUNAT

### Contexto
Nubefact devuelve el campo `cadena_para_codigo_qr` en su respuesta al emitir un comprobante. Actualmente ese dato no se guarda. El objetivo es capturarlo y usarlo para generar un ticket propio (estilo térmico 80mm) similar al de comprobantes (`InvoicePrintPage.tsx`), pero con el QR del certificado SUNAT.

### Cambios

**1. Migración de base de datos**
- Agregar columna `qr_data` (text, nullable) a la tabla `invoices` para almacenar la cadena QR que devuelve Nubefact.

**2. Actualizar edge function `emit-invoice`**
- Descargar la versión desplegada, modificarla para que al recibir la respuesta de Nubefact, extraiga `cadena_para_codigo_qr` y la guarde en `invoices.qr_data`.
- Redesplegar directamente sin guardar en el repo.

**3. Crear página de ticket POS: `src/modules/sales/pages/POSTicketPrintPage.tsx`**
- Ruta: `/pos/ticket/:orderId` (o `/pos/ticket/:invoiceId`)
- Genera un PDF con jsPDF de 80mm similar a `InvoicePrintPage.tsx`:
  - Logo, datos empresa (desde `paremeters`), tipo de comprobante, serie-número
  - Datos del cliente, fecha, productos, totales, monto en letras, cajero
  - **QR code** generado a partir de `invoices.qr_data` usando una librería QR (ej: `qrcode` para generar imagen base64)
  - Política de cambios y devoluciones, mensaje de agradecimiento

**4. Agregar botón de impresión en `InvoicingStep.tsx`**
- En la tabla de comprobantes del POS, cuando un comprobante está emitido (`declared = true`), mostrar un botón de impresión de ticket que abra `/pos/ticket/:invoiceId` en nueva pestaña.

**5. Dependencia nueva**
- Instalar paquete `qrcode` para generar el QR como imagen base64 dentro del PDF con jsPDF.

### Flujo
```text
Emitir comprobante → emit-invoice guarda qr_data → 
Usuario click "Imprimir ticket" → POSTicketPrintPage carga invoice + items + qr_data →
Genera PDF 80mm con QR → Abre en navegador
```

### Notas
- Los comprobantes ya emitidos antes del cambio no tendrán `qr_data`; el ticket se generará sin QR en ese caso.
- La estructura del ticket reutiliza la misma lógica de `InvoicePrintPage.tsx` (logo, empresa, numberToWords, etc.).

