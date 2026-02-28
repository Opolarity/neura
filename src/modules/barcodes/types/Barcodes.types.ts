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
}

export interface StockMovementOption {
  id: number;
  label: string;
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
