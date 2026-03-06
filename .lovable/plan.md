

## Diagnóstico

El logo PNG existe y es válido en Supabase Storage. He confirmado que la URL `InvoiceLogoUrl` devuelve una imagen PNG real.

El problema persiste porque el paso de `new Image()` + `img.src = dataUrl` no funciona correctamente en ciertos entornos de navegador (como iframes de preview). El `img.onload` puede no dispararse o el canvas puede no decodificar la imagen correctamente, resultando en datos JPEG corruptos que jsPDF renderiza como un bloque negro.

## Solución

Reemplazar `new Image()` por `createImageBitmap(blob)`, que es una API moderna del navegador que decodifica la imagen directamente desde el blob sin necesidad de un elemento Image ni data URLs intermedios. Esto elimina el paso problemático por completo.

### Nuevo `loadImage` (ambos archivos)

```typescript
const loadImage = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.95);
};
```

**Por qué esto funciona:**
- `createImageBitmap(blob)` decodifica la imagen directamente del blob binario, sin pasar por `new Image()` ni data URLs
- El canvas con fondo blanco aplana cualquier transparencia PNG (evita que jsPDF la convierta en negro)
- La salida es JPEG (sin canal alfa), lo cual jsPDF maneja sin problemas
- Es más rápido y confiable que la cadena anterior de FileReader → data URL → Image → canvas

### Archivos a modificar

1. `src/modules/invoices/pages/InvoicePrintPage.tsx` — reemplazar `loadImage` (líneas 94-119)
2. `src/modules/sales/pages/POSTicketPrintPage.tsx` — reemplazar `loadImage` (líneas 96-121)

