import { supabase } from "@/integrations/supabase/client";
import type {
  FetchProductVariationsParams,
  ProductVariationsApiResponse,
} from "./ProductVariationSelector.types";

export const fetchProductVariations = async (
  params: FetchProductVariationsParams,
): Promise<ProductVariationsApiResponse> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("p_page", String(params.page));
  if (params.size) queryParams.set("p_size", String(params.size));
  if (params.search) queryParams.set("p_search", params.search);
  if (params.stockTypeId)
    queryParams.set("p_stock_type_id", String(params.stockTypeId));
  if (params.warehouseId)
    queryParams.set("p_warehouse_id", String(params.warehouseId));

  const endpoint = queryParams.toString()
    ? `get-sale-products?${queryParams.toString()}`
    : "get-sale-products";

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;
  return data;
};
