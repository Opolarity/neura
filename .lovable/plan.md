

## Problema

El rectángulo negro aparece tanto con imágenes locales como externas. El enfoque con `canvas` + `toDataURL` falla cuando hay restricciones de origen cruzado (como en el preview de Lovable o en algunos entornos de hosting). La solución actual solo usa `fetch` para URLs que empiezan con `http`, pero las imágenes locales (`/images/logo-ticket.png`) también pueden tener problemas con el canvas.

## Solución

Unificar el `loadImage` para que **siempre** use `fetch()` → blob → base64, sin importar si la URL es local o externa. Esto elimina completamente la dependencia del canvas.

### Cambios en 2 archivos

**`src/modules/invoices/pages/InvoicePrintPage.tsx`** y **`src/modules/sales/pages/POSTicketPrintPage.tsx`**:

Reemplazar el `loadImage` actual por:

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

Esto elimina el branch condicional y el uso del canvas por completo, usando siempre fetch para cualquier imagen.

