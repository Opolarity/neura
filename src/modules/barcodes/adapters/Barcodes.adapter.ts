import { VariationOption, StockMovementOption, PriceListOption, BarcodeListItem } from "../types/Barcodes.types";

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

// =============================================================================
// Adapter para listado de barcodes
// =============================================================================

export const barcodeListAdapter = (rawData: any[]): BarcodeListItem[] => {
  return rawData.map((bc) => {
    const productTitle = bc.variations?.products?.title || "Sin título";
    const sku = bc.variations?.sku || null;
    const priceListName = bc.price_list?.name || "—";

    // Build variation terms
    const termsStr = (bc.variations?.variation_terms || [])
      .map((vt: any) => {
        const groupName = vt.terms?.term_groups?.name || "";
        const termName = vt.terms?.name || "";
        return groupName ? `${groupName} - ${termName}` : termName;
      })
      .join(", ");

    return {
      id: bc.id,
      productTitle,
      sku,
      priceListName,
      sequence: bc.sequence,
      quantities: bc.quantities,
      createdAt: bc.created_at,
      variationId: bc.product_variation_id,
      variationTerms: termsStr,
      priceListId: bc.price_list_id,
      barcodeValue: `${bc.product_variation_id}-${bc.sequence}`,
    };
  });
};
