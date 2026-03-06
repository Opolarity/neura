

## Diagnostico

He confirmado que:
1. El logo `/images/logo-ticket.png` es un PNG con **transparencia** (fondo transparente)
2. jsPDF tiene un **bug conocido** donde renderiza las areas transparentes de PNG como negro
3. El enfoque con canvas + `createImageBitmap` + `toDataURL("image/jpeg")` no funciona de manera confiable en el entorno del preview (iframe con restricciones)

## Solucion: Fondo blanco directamente en el PDF

En lugar de intentar convertir la imagen en el navegador (canvas), la solucion mas robusta es:

1. **Cargar la imagen como base64 sin canvas** (solo fetch + FileReader)
2. **Dibujar un rectangulo blanco en el PDF** antes de colocar la imagen
3. **Usar formato "PNG"** en `addImage` (en vez de "JPEG")

Esto hace que jsPDF dibuje la transparencia del PNG sobre un fondo blanco que ya existe en el PDF, eliminando el rectangulo negro.

### Cambio en `loadImage` (ambos archivos)

```typescript
const loadImage = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
```

### Cambio en la seccion de logo (ambos archivos)

```typescript
try {
  const logoImg = await loadImage(logoUrl);
  const logoSize = 22;
  const logoX = (pageWidth - logoSize) / 2;
  // Dibujar fondo blanco detras del logo para evitar transparencia negra
  doc.setFillColor(255, 255, 255);
  doc.rect(logoX, y, logoSize, logoSize, "F");
  doc.addImage(logoImg, "PNG", logoX, y, logoSize, logoSize);
  y += logoSize + 2;
} catch {
  y += 2;
}
```

### Archivos a modificar

1. `src/modules/invoices/pages/InvoicePrintPage.tsx` — loadImage (lineas 94-107) y seccion logo (lineas 200-207)
2. `src/modules/sales/pages/POSTicketPrintPage.tsx` — loadImage (lineas 96-109) y seccion logo (lineas ~190-197)

### Por que esto funciona

- Sin canvas, sin `createImageBitmap`, sin conversion a JPEG — elimina todos los pasos problematicos
- El rectangulo blanco en el PDF actua como fondo opaco para la transparencia del PNG
- jsPDF maneja el PNG directamente sin necesidad de pre-procesamiento del navegador

