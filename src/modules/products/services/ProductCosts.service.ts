import { supabase } from "@/integrations/supabase/client";
import {
  ProductCostsApiResponse,
  ProductCostsFilters,
} from "../types/ProductCosts.types";

export const productCostsApi = async (
  filters: ProductCostsFilters = {}
): Promise<ProductCostsApiResponse> => {
  const queryParams = new URLSearchParams(
    Object.entries(filters)
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== ""
      )
      .map(([key, value]) => [key, String(value)])
  );

  const endpoint = queryParams.toString()
    ? `get-product-costs?${queryParams.toString()}`
    : "get-product-costs";

  const { data, error } = await supabase.functions.invoke(endpoint);

  if (error) {
    console.error("Invoke error:", error);
    throw error;
  }

  return (
    data ?? {
      products: {
        data: [],
        page: { page: 1, size: 20, total: 0 },
      },
    }
  );
};
