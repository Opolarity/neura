import { MovementRequestApiResponse } from "../types/MovementRequests.types";

export const createMovementRequestAdapter = (response: MovementRequestApiResponse) => {
  return {
    success: response.success,
    requestId: response.request.id,
    reason: response.request.reason,
    outWarehouseId: response.request.out_warehouse_id,
    inWarehouseId: response.request.in_warehouse_id,
    createdAt: response.request.created_at,
  };
};
