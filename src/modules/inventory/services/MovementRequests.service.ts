import { supabase } from "@/integrations/supabase/client";
import { MovementRequestPayload, MovementRequestApiResponse } from "../types/MovementRequests.types";
import {
  GetStockMovementRequestResponse,
  MovementRequestFilters,
} from "../types/MovementRequestList.types";

export const createMovementRequestApi = async (
  payload: MovementRequestPayload
): Promise<MovementRequestApiResponse> => {
  const { data, error } = await supabase.functions.invoke(
    "create-stock-movements-request",
    {
      method: "POST",
      body: payload,
    }
  );

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};

export const getStockMovementRequestsApi = async (
  filters: MovementRequestFilters
): Promise<GetStockMovementRequestResponse> => {
  const params = new URLSearchParams();
  params.set("view", filters.view);
  if (filters.situation_id !== null && filters.situation_id !== undefined) {
    params.set("situation_id", String(filters.situation_id));
  }
  if (filters.page !== undefined) {
    params.set("page", String(filters.page));
  }
  if (filters.page_size !== undefined) {
    params.set("page_size", String(filters.page_size));
  }

  const endpoint = `get-stock-movement-request?${params.toString()}`;

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) {
    console.error("Invoke error in getStockMovementRequestsApi:", error);
    throw error;
  }

  return (
    data ?? {
      data: [],
      page: { total: 0, p_page: 1, p_size: 20 },
      userWarehouseId: null,
      situations: [],
    }
  );
};
