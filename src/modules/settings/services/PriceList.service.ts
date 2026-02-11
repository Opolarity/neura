import { supabase } from "@/integrations/supabase/client";
import type {
  PriceListApiResponse,
  PriceListFilters,
  PriceListItem,
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
