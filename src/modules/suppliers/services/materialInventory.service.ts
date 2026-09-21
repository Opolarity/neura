import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/query";
import {
  MaterialInventoryApiResponse,
  MaterialInventoryFilters,
} from "../types/materialInventory.types";

export const getMaterialInventoryApi = async (
  filters: MaterialInventoryFilters = {},
): Promise<MaterialInventoryApiResponse> => {
  const { owner, ...rest } = filters;

  const endpoint = buildEndpoint("get-material-inventory", {
    ...rest,
    // "all" es la ausencia de filtro: se deja de mandar en vez de viajar como
    // un valor que el SP tendría que saber interpretar.
    owner: owner && owner !== "all" ? owner : null,
  });

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;

  return (
    data ?? {
      inventorydata: {
        warehouses: [],
        data: [],
        page: { page: 1, size: 20, total: 0 },
      },
    }
  );
};
