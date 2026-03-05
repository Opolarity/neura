// =============================================================================
// TIPOS PARA EL PAYLOAD DE CREACIÓN
// =============================================================================

export interface CreateBarcodePayload {
  product_variation_id: number;
  price_list_id: number;
  stock_movement_id?: number | null;
  sequence: number;
  quantities: number;
}

// =============================================================================
// TIPOS PARA OPCIONES DE SELECT
// =============================================================================

export interface VariationOption {
  variationId: number;
  sku: string | null;
  productTitle: string;
  terms: string; // "TALLA - M"
  label: string; // "Producto - TALLA M"
  stockTypeName: string | null;
}

export interface StockMovementOption {
  id: number;
  label: string;
  productVariationId: number;
  productTitle: string;
  variationTerms: string;
  sku: string | null;
  quantity: number;
  createdAt: string;
  userName: string;
}

export interface PriceListOption {
  id: number;
  name: string;
  code: string | null;
}

// =============================================================================
// TIPOS PARA DATOS DEL PDF
// =============================================================================

export interface BarcodeTicketData {
  productTitle: string;
  variationTerms: string;
  price: number;
  barcodeValue: string; // value to encode in barcode
}

// =============================================================================
// TIPOS PARA LISTADO
// =============================================================================

export interface BarcodeListItem {
  id: number;
  productTitle: string;
  sku: string | null;
  priceListName: string;
  sequence: number;
  quantities: number | null;
  createdAt: string;
  stockMovementId: number | null;
  // For re-print
  variationId: number;
  variationTerms: string;
  priceListId: number;
  barcodeValue: string;
}

// =============================================================================
// TIPOS PARA RESPUESTA DE API
// =============================================================================

export interface CreateBarcodeResponse {
  success: boolean;
  barcode: {
    id: number;
    product_variation_id: number;
    price_list_id: number;
    stock_movement_id: number | null;
    sequence: number;
    quantities: number;
    created_by: string;
    created_at: string;
  };
}
