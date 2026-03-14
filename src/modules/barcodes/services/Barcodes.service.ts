import { supabase } from "@/integrations/supabase/client";
import { CreateBarcodePayload, CreateBarcodeResponse } from "../types/Barcodes.types";

// =============================================================================
// Search variations for barcode (paginated, via edge function + RPC)
// =============================================================================

export interface SearchVariationsParams {
  page?: number;
  size?: number;
  search?: string;
}

export interface SearchVariationsResponse {
  data: Array<{
    variation_id: number;
    sku: string | null;
    product_title: string;
    is_variable: boolean;
    terms_names: string;
    stock_type_name: string | null;
  }>;
  page: { page: number; size: number; total: number };
}

export const searchBarcodeVariations = async (
  params: SearchVariationsParams
): Promise<SearchVariationsResponse> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("p_page", String(params.page));
  if (params.size) queryParams.set("p_size", String(params.size));
  if (params.search) queryParams.set("p_search", params.search);

  const endpoint = queryParams.toString()
    ? `search-barcode-variations?${queryParams.toString()}`
    : "search-barcode-variations";

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;
  return data;
};

// =============================================================================
// Search stock movements MER for barcode (paginated, via edge function + RPC)
// =============================================================================

export interface SearchMovementsParams {
  page?: number;
  size?: number;
  search?: string;
}

export interface SearchMovementsResponse {
  data: Array<{
    id: number;
    created_at: string;
    quantity: number;
    product_variation_id: number;
    product_title: string;
    is_variable: boolean;
    terms_names: string;
    sku: string | null;
    user_name: string;
  }>;
  page: { page: number; size: number; total: number };
}

export const searchBarcodeMovements = async (
  params: SearchMovementsParams
): Promise<SearchMovementsResponse> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("p_page", String(params.page));
  if (params.size) queryParams.set("p_size", String(params.size));
  if (params.search) queryParams.set("p_search", params.search);

  const endpoint = queryParams.toString()
    ? `search-barcode-movements?${queryParams.toString()}`
    : "search-barcode-movements";

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;
  return data;
};

// =============================================================================
// Obtener listas de precio activas
// =============================================================================

export const getActivePriceLists = async () => {
  const { data, error } = await supabase
    .from("price_list")
    .select("id, name, code")
    .eq("is_active", true)
    .order("name");

  if (error) throw error;
  return data ?? [];
};

// =============================================================================
// Obtener listado de barcodes
// =============================================================================

export const fetchBarcodesList = async () => {
  const { data, error } = await (supabase as any)
    .from("bar_codes")
    .select(`
      id,
      product_variation_id,
      price_list_id,
      stock_movement_id,
      sequence,
      quantities,
      created_at,
      variations!inner(
        id,
        sku,
        products!inner(title),
        variation_terms(
          term_id,
          terms(
            name
          )
        )
      ),
      price_list!inner(name)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
};

// =============================================================================
// Obtener siguiente sequence para una variación
// =============================================================================

export const getNextSequence = async (productVariationId: number): Promise<number> => {
  const { data, error } = await supabase
    .from("bar_codes")
    .select("sequence")
    .eq("product_variation_id", productVariationId)
    .order("sequence", { ascending: false })
    .limit(1);

  if (error) throw error;

  if (data && data.length > 0) {
    return data[0].sequence + 1;
  }
  return 1;
};

// =============================================================================
// Obtener el último lote (sequence) vinculado a un movimiento de stock
// =============================================================================

export const getLastSequenceByStockMovement = async (stockMovementId: number): Promise<number | null> => {
  const { data, error } = await supabase
    .from("bar_codes")
    .select("sequence")
    .eq("stock_movement_id", stockMovementId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;

  if (data && data.length > 0) {
    return data[0].sequence;
  }
  return null;
};

// =============================================================================
// Obtener precio de una variación en una lista de precios
// =============================================================================

export const getVariationPrice = async (
  productVariationId: number,
  priceListId: number
): Promise<{ price: number | null } | null> => {
  const { data, error } = await supabase
    .from("product_price")
    .select("price, sale_price")
    .eq("product_variation_id", productVariationId)
    .eq("price_list_id", priceListId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return { price: data.sale_price ?? data.price };
};

// =============================================================================
// Crear barcode via edge function
// =============================================================================

export const createBarcodeApi = async (
  payload: CreateBarcodePayload
): Promise<CreateBarcodeResponse> => {
  const { data, error } = await supabase.functions.invoke("create-barcode", {
    method: "POST",
    body: payload,
  });

  if (error) {
    console.error("Error creating barcode:", error);
    throw error;
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
};
