import { supabase } from "@/integrations/supabase/client";
import type {
  PriceListApiResponse,
  PriceListFilters,
  PriceListItem,
  PriceListPayload,
} from "../../settings/types/PriceList.types";
import { buildEndpoint } from "@/shared/utils/query";

export const getPriceLists = async (
  filters: PriceListFilters,
): Promise<PriceListApiResponse> => {
  const endpoint = buildEndpoint("get-price-list", filters);

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) {
    console.error("Invoke error:", error);
    throw error;
  }

  return data;
};

export const createPriceListApi = async (newPriceList: PriceListPayload) => {
  const { data, error } = await supabase.functions.invoke("create-price-list", {
    method: "POST",
    body: newPriceList,
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};

export const deletePriceListApi = async (id: number) => {
  const { data, error } = await supabase.functions.invoke("delete-price-list", {
    body: { id },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return data;
};
