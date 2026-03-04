import { VariationOption, StockMovementOption, PriceListOption, BarcodeListItem } from "../types/Barcodes.types";

// =============================================================================
// Helper: build terms string from variation_terms
// =============================================================================

const buildTermsString = (variationTerms: any[]): string => {
  return (variationTerms || [])
    .map((vt: any) => {
      const groupName = vt.terms?.term_groups?.name || "";
      const termName = vt.terms?.name || "";
      return groupName ? `${groupName} - ${termName}` : termName;
    })
    .join(", ");
};

// =============================================================================
// Adapter para variaciones
// =============================================================================

export const variationsAdapter = (rawData: any[]): VariationOption[] => {
  return rawData.map((v) => {
    const productTitle = v.products?.title || "Sin título";
    const termsStr = buildTermsString(v.variation_terms);

    const label = termsStr
      ? `${productTitle} - ${termsStr}`
      : productTitle;

    // Get first stock type name if available
    const stockTypeName = v.product_stock?.[0]?.types?.name || null;

    return {
      variationId: v.id,
      sku: v.sku,
      productTitle,
      terms: termsStr,
      label,
      stockTypeName,
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
    
    // Product info from variation
    const productTitle = sm.variations?.products?.title || "Sin título";
    const termsStr = buildTermsString(sm.variations?.variation_terms);
    const sku = sm.variations?.sku || null;

    // User name from profile -> account
    const account = sm.profiles?.accounts;
    const userName = account 
      ? [account.name, account.last_name].filter(Boolean).join(" ")
      : "—";

    return {
      id: sm.id,
      label: `#${sm.id} - ${warehouseName} - ${date} (Cant: ${sm.quantity})`,
      productVariationId: sm.product_variation_id,
      productTitle,
      variationTerms: termsStr,
      sku,
      quantity: sm.quantity,
      createdAt: sm.created_at,
      userName,
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
    const termsStr = buildTermsString(bc.variations?.variation_terms);

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
