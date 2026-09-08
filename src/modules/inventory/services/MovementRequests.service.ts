import { MovementRequestPayload, MovementRequestApiResponse } from "../types/MovementRequests.types";
import {
  GetStockMovementRequestResponse,
  MovementRequestFilters,
} from "../types/MovementRequestList.types";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";

export const createMovementRequestApi = async (
  payload: MovementRequestPayload
): Promise<MovementRequestApiResponse> => {
  const data = await invokeFunction(
    "create-stock-movements-request",
    {
      method: "POST",
      body: payload,
    }
  );
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

  const data = await invokeFunction(endpoint, {
    method: "GET",
  });

  return (
    data ?? {
      data: [],
      page: { total: 0, p_page: 1, p_size: 20 },
      userWarehouseId: null,
      situations: [],
    }
  );
};
