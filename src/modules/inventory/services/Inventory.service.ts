import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/utils";
import {
  InventoryApiResponse,
  InventoryFilters,
  InventoryPayload,
  InventoryTypesApiResponse,
  Warehouse,
} from "../types/Inventory.types";

export const wareHouseListApi = async (): Promise<Warehouse[]> => {
  const { data, error } = await supabase
    .from("warehouses")
    .select("id, name")
    .order("name")
    .eq("is_active", true);
  if (error) throw error;
  return data ?? [];
};

export const inventoryApi = async (
  filters: InventoryFilters = {},
): Promise<InventoryApiResponse> => {
  const endpoint = buildEndpoint("get-inventory", filters);

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) {
    console.error("Invoke error:", error);
    throw error;
  }

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
  const { data, error } = await supabase.functions.invoke(
    "create-stock-movements-entrance",
    {
      body: updateCategory,
    },
  );

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
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