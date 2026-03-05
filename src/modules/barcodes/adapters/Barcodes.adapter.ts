import { VariationOption, StockMovementOption, PriceListOption, BarcodeListItem } from "../types/Barcodes.types";

// =============================================================================
// Helper: build terms string from variation_terms (just term names, no group)
// =============================================================================

const buildTermsString = (variationTerms: any[]): string => {
  return (variationTerms || [])
    .map((vt: any) => vt.terms?.name || "")
    .filter(Boolean)
    .join("-");
};

// =============================================================================
// Adapter para variaciones desde RPC
// =============================================================================

export const variationsFromRpcAdapter = (rawData: any[]): VariationOption[] => {
  return (rawData || []).map((v: any) => {
    const productTitle = v.product_title || "Sin título";
    const termsStr = v.terms_names || "";

    const label = v.is_variable && termsStr
      ? `${productTitle} (${termsStr})`
      : productTitle;

    return {
      variationId: v.variation_id,
      sku: v.sku,
      productTitle,
      terms: termsStr,
      label,
      stockTypeName: v.stock_type_name || null,
    };
  });
};

// =============================================================================
// Adapter para stock movements desde RPC
// =============================================================================

export const stockMovementsFromRpcAdapter = (rawData: any[]): StockMovementOption[] => {
  return (rawData || []).map((sm: any) => {
    const productTitle = sm.product_title || "Sin título";
    const termsStr = sm.terms_names || "";

    const displayName = sm.is_variable && termsStr
      ? `${productTitle} (${termsStr})`
      : productTitle;

    return {
      id: sm.id,
      label: displayName,
      productVariationId: sm.product_variation_id,
      productTitle,
      variationTerms: termsStr,
      sku: sm.sku || null,
      quantity: sm.quantity,
      createdAt: sm.created_at,
      userName: sm.user_name || "—",
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
      stockMovementId: bc.stock_movement_id ?? null,
      variationId: bc.product_variation_id,
      variationTerms: termsStr,
      priceListId: bc.price_list_id,
      barcodeValue: `${bc.product_variation_id}-${bc.sequence}`,
    };
  });
};
