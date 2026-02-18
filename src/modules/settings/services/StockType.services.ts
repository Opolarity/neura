import { supabase } from "@/integrations/supabase/client";
import { StockTypeApiResponse, StockTypeFilters, StockTypePayload } from "../types/StockType.types";
import { buildEndpoint } from "@/shared/utils/query";

export const getStockTypesApi = async (
  filters: StockTypeFilters
): Promise<StockTypeApiResponse> => {
  const endpoint = buildEndpoint("get-stock-types", filters);

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;
  return data;
};

export const createStockTypeApi = async (payload: StockTypePayload) => {
  const { data, error } = await supabase.functions.invoke("create-stock-type", {
    method: "POST",
    body: payload,
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};

export const updateStockTypeApi = async (payload: StockTypePayload) => {
  const { data, error } = await supabase.functions.invoke("update-stock-type", {
    method: "PUT",
    body: payload,
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};
