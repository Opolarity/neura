import type {
  PriceListApiResponse,
  PriceListFilters,
  PriceListItem,
  PriceListPayload,
} from "../../settings/types/PriceList.types";
import { buildEndpoint } from "@/shared/utils/query";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";

export const getPriceLists = async (
  filters: PriceListFilters,
): Promise<PriceListApiResponse> => {
  const endpoint = buildEndpoint("get-price-list", filters);

  const data = await invokeFunction(endpoint, {
    method: "GET",
  });

  return data;
};

export const createPriceListApi = async (newPriceList: PriceListPayload) => {
  const data = await invokeFunction("create-price-list", {
    method: "POST",
    body: newPriceList,
  });
  return data;
};

export const updatePriceListApi = async (newPriceList: PriceListPayload) => {
  const data = await invokeFunction("update-price-list", {
    method: "POST",
    body: newPriceList,
  });
  return data;
};

export const deletePriceListApi = async (id: number) => {
  const data = await invokeFunction("delete-price-list", {
    body: { id },
  });

  return data;
};
