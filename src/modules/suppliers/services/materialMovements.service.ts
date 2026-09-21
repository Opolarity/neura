import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/query";
import {
  MaterialMovementDetailApiResponse,
  MaterialMovementsApiResponse,
  MaterialMovementsFilters,
} from "../types/materialMovements.types";

export const getMaterialStockMovementsApi = async (
  filters: MaterialMovementsFilters = {},
): Promise<MaterialMovementsApiResponse> => {
  const endpoint = buildEndpoint("get-material-stock-movements", filters);

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;

  return (
    data ?? {
      movementsdata: { data: [], page: { page: 1, size: 20, total: 0 } },
    }
  );
};

export const getMaterialStockMovementDetailApi = async (
  id: number,
): Promise<MaterialMovementDetailApiResponse> => {
  const endpoint = buildEndpoint("get-material-stock-movement-detail", { id });

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;
  return data;
};
