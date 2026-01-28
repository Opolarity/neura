import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/utils";
import {
  ProductCostsApiResponse,
  ProductCostsFilters,
} from "../types/ProductCosts.types";

export const productCostsApi = async (
  filters: ProductCostsFilters = {}
): Promise<ProductCostsApiResponse> => {
  const endpoint = buildEndpoint("get-product-costs", filters);

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
