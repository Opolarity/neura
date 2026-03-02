import { VariationOption, StockMovementOption, PriceListOption } from "../types/Barcodes.types";

// =============================================================================
// Adapter para variaciones
// =============================================================================

export const variationsAdapter = (rawData: any[]): VariationOption[] => {
  return rawData.map((v) => {
    const productTitle = v.products?.title || "Sin título";

    // Build terms string from variation_terms
    const termsStr = (v.variation_terms || [])
      .map((vt: any) => {
        const groupName = vt.terms?.term_groups?.name || "";
        const termName = vt.terms?.name || "";
        return groupName ? `${groupName} - ${termName}` : termName;
      })
      .join(", ");

    const label = termsStr
      ? `${productTitle} - ${termsStr}`
      : productTitle;

    return {
      variationId: v.id,
      sku: v.sku,
      productTitle,
      terms: termsStr,
      label,
    };
  });
};

// =============================================================================
// Adapter para stock movements
// =============================================================================

export const stockMovementsAdapter = (rawData: any[]): StockMovementOption[] => {
  return rawData.map((sm) => {
    const date = new Date(sm.created_at).toLocaleDateString("es-PE");
    const warehouseName = sm.warehouses?.name || "";
    return {
      id: sm.id,
      label: `#${sm.id} - ${warehouseName} - ${date} (Cant: ${sm.quantity})`,
    };
  });
};

// =============================================================================
// Adapter para price lists
// =============================================================================

export const priceListsAdapter = (rawData: any[]): PriceListOption[] => {
  return rawData.map((pl) => ({
    id: pl.id,
    name: pl.name,
    code: pl.code,
  }));
};
