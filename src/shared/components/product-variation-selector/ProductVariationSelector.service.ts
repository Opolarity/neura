import type {
  FetchProductVariationsParams,
  FetchProductsParams,
  ProductVariationsApiResponse,
  ProductsApiResponse,
} from "./ProductVariationSelector.types";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";

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

  const data = await invokeFunction(endpoint, {
    method: "GET",
  });
  return data;
};

export const fetchProducts = async (
  params: FetchProductsParams,
): Promise<ProductsApiResponse> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("p_page", String(params.page));
  if (params.size) queryParams.set("p_size", String(params.size));
  if (params.search) queryParams.set("p_search", params.search);
  if (params.ids?.length) queryParams.set("p_ids", params.ids.join(","));

  const endpoint = queryParams.toString()
    ? `get-products-selector?${queryParams.toString()}`
    : "get-products-selector";

  const data = await invokeFunction(endpoint, {
    method: "GET",
  });
  return data;
};
