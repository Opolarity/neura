import { StockTypeApiResponse, StockTypeFilters, StockTypePayload } from "../types/StockType.types";
import { buildEndpoint } from "@/shared/utils/query";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";

export const getStockTypesApi = async (
  filters: StockTypeFilters
): Promise<StockTypeApiResponse> => {
  const endpoint = buildEndpoint("get-stock-types", filters);

  const data = await invokeFunction(endpoint, {
    method: "GET",
  });
  return data;
};

export const createStockTypeApi = async (payload: StockTypePayload) => {
  const data = await invokeFunction("create-stock-type", {
    method: "POST",
    body: payload,
  });
  return data;
};

export const updateStockTypeApi = async (payload: StockTypePayload) => {
  const data = await invokeFunction("update-stock-type", {
    method: "PUT",
    body: payload,
  });
  return data;
};
