import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/utils";
import {
  InventoryApiResponse,
  InventoryFilters,
  InventoryPayload,
  InventoryTypesApiResponse,
  Warehouse,
} from "../types/Inventory.types";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";



export const inventoryApi = async (
  filters: InventoryFilters = {},
): Promise<InventoryApiResponse> => {
  const endpoint = buildEndpoint("get-inventory", filters);

  const data = await invokeFunction(endpoint, {
    method: "GET",
  });

  return (
    data ?? {
      data: [],
      page: { page: 1, size: 20, total: 0 },
    }
  );
};

export const updateInventoryApi = async (
  updateCategory: InventoryPayload[],
) => {
  await invokeFunction(
    "create-stock-movements-entrance",
    {
      body: updateCategory,
    },
  );
};

export const inventoryTypesApi = async (): Promise<
  InventoryTypesApiResponse[]
> => {
  const { data, error } = await supabase
    .from("modules")
    .select("types(id,name,code)")
    .eq("code", "STK")
    .order("name");
  if (error) throw error;
  return data ?? [];
};