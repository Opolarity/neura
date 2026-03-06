

## Diagnostico

El parametro `InvoiceLogoUrl` ya apunta correctamente a `invoices-logo.jpg`. Sin embargo, en ambos archivos el codigo tiene:

```typescript
doc.addImage(logoImg, "PNG", logoX, y, logoSize, logoSize);
```

Esto le dice a jsPDF que interprete los bytes como PNG cuando en realidad es un JPEG. Resultado: imagen corrupta que se renderiza como negro.

Ademas, el fallback local sigue apuntando a `/images/logo-ticket.png`.

## Solucion

### 1. Auto-detectar formato desde el data URL

Reemplazar el formato hardcodeado por deteccion automatica basada en el prefijo del data URL:

```typescript
const format = logoImg.startsWith("data:image/png") ? "PNG" : "JPEG";
doc.addImage(logoImg, format, logoX, y, logoSize, logoSize);
```

### 2. Actualizar fallback local

Cambiar `/images/logo-ticket.png` a `/images/logo-ticket.jpg` (o mantener `.png` si ese archivo existe, pero con la auto-deteccion ya no importa).

### Archivos a modificar

1. **`src/modules/invoices/pages/InvoicePrintPage.tsx`** — linea 202: cambiar `"PNG"` por deteccion automatica
2. **`src/modules/sales/pages/POSTicketPrintPage.tsx`** — linea 193: cambiar `"PNG"` por deteccion automatica

Son cambios de 1 linea en cada archivo.

