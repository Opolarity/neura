// Lo único de `lib/adapters.ts` del ecommerce que usan los bloques del editor.
// La imagen vive en public/ del ERP con la misma ruta que en la tienda.
export const PRODUCT_PLACEHOLDER = "/product-placeholder.png";

export function normalizeImages(images?: string[] | null): string[] {
  const valid = (images ?? []).filter((url) => url && url.trim() !== "");
  return valid.length > 0 ? valid : [PRODUCT_PLACEHOLDER];
}
