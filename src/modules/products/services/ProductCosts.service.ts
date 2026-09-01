import { buildEndpoint } from "@/shared/utils/utils";
import {
  ProductCostsApiResponse,
  ProductCostsFilters,
} from "../types/ProductCosts.types";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";

export const productCostsApi = async (
  filters: ProductCostsFilters = {}
): Promise<ProductCostsApiResponse> => {
  const endpoint = buildEndpoint("get-product-costs", filters);

  const data = await invokeFunction(endpoint);

  return (
    data ?? {
      products: {
        data: [],
        page: { page: 1, size: 20, total: 0 },
      },
    }
  );
};
