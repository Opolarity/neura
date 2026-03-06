

## Problema: Logo aparece como rectángulo negro

El logo de `InvoiceLogoUrl` apunta a una URL de Supabase Storage (`https://wwcdntjnpoaacarmmzir.supabase.co/storage/v1/object/public/sales/invoices-logo.png`). Cuando se carga con `new Image()` y se pasa a `jsPDF.addImage()`, la imagen se renderiza como un bloque negro. Esto es un problema conocido de CORS con jsPDF: aunque la imagen "carga", el canvas no puede leer sus datos correctamente desde un origen cruzado.

## Solución

Cambiar `loadImage` en ambos archivos para que, cuando la URL sea externa (http/https), use `fetch()` para obtener la imagen como blob y convertirla a base64 data URL. Esto evita el problema de CORS porque jsPDF recibe directamente los datos de la imagen en lugar de intentar leerlos de un canvas.

### Archivos a modificar

1. **`src/modules/invoices/pages/InvoicePrintPage.tsx`** — Actualizar `loadImage` para usar `fetch` + blob → data URL cuando la URL es externa.

2. **`src/modules/sales/pages/POSTicketPrintPage.tsx`** — Misma corrección.

### Lógica del nuevo `loadImage`

```typescript
const loadImage = async (url: string): Promise<string> => {
  if (url.startsWith("http")) {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  // Local images: use Image element as before
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
};
```

Y en `addImage`, pasar el data URL string directamente en lugar del HTMLImageElement.

