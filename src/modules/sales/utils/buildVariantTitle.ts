// Builds the invoice item description: product title + variation terms, e.g. "Polo (L-Rojo)".
// Expects an order_products row with the embed `variations(variation_terms(terms(name)))`.
export const buildVariantTitle = (orderProduct: any, baseTitle: string): string => {
  const termsStr = (orderProduct.variations?.variation_terms || [])
    .map((vt: any) => vt.terms?.name || "")
    .filter(Boolean)
    .join("-");
  return termsStr ? `${baseTitle} (${termsStr})` : baseTitle;
};
