import { supabase } from "@/integrations/supabase/client";
import { CreateBarcodePayload, CreateBarcodeResponse } from "../types/Barcodes.types";

// =============================================================================
// Obtener variaciones con producto y términos
// =============================================================================

export const getVariationsForSelect = async () => {
  const { data, error } = await (supabase as any)
    .from("variations")
    .select(`
      id,
      sku,
      product_id,
      products!inner(title),
      variation_terms(
        term_id,
        terms(
          name,
          term_group_id,
          term_groups(name)
        )
      )
    `)
    .eq("is_active", true)
    .order("id", { ascending: true });

  if (error) throw error;
  return data ?? [];
};

// =============================================================================
// Obtener stock movements filtrados por tipo MER del módulo STM
// =============================================================================

export const getStockMovementsByMER = async () => {
  // 1. Obtener module_id de STM
  const { data: moduleData, error: moduleError } = await (supabase as any)
    .from("modules")
    .select("id")
    .eq("code", "STM")
    .single();

  if (moduleError) throw moduleError;

  // 2. Obtener type_id de MER en ese módulo
  const { data: typeData, error: typeError } = await (supabase as any)
    .from("types")
    .select("id")
    .eq("code", "MER")
    .eq("module_id", moduleData.id)
    .single();

  if (typeError) throw typeError;

  // 3. Obtener stock_movements con ese movement_type
  const { data, error } = await (supabase as any)
    .from("stock_movements")
    .select("id, created_at, quantity, warehouse_id, warehouses(name)")
    .eq("movement_type", typeData.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
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
// Obtener precio de una variación en una lista de precios
// =============================================================================

export const getVariationPrice = async (
  productVariationId: number,
  priceListId: number
) => {
  const { data, error } = await supabase
    .from("product_price")
    .select("price, sale_price")
    .eq("product_variation_id", productVariationId)
    .eq("price_list_id", priceListId)
    .single();

  if (error) throw error;
  return data;
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
