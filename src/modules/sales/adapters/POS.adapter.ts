// =============================================
// POS Adapters
// Transform API responses to frontend format
// =============================================

import type { POSSession, POSSessionApiResponse } from "../types/POS.types";

export const adaptPOSSession = (
  apiResponse: POSSessionApiResponse
): POSSession => {
  return {
    // Handle both "id" (from get-active) and "session_id" (from open/close)
    id: apiResponse.id ?? apiResponse.session_id,
    userId: apiResponse.user_id,
    warehouseId: apiResponse.warehouse_id,
    branchId: apiResponse.branch_id,
    openingAmount: apiResponse.opening_amount,
    closingAmount: apiResponse.closing_amount ?? null,
    expectedAmount: apiResponse.expected_amount ?? null,
    difference: apiResponse.difference ?? null,
    status_id: apiResponse.status_id,
    openedAt: apiResponse.opened_at,
    closedAt: apiResponse.closed_at ?? null,
    notes: apiResponse.notes ?? null,
  };
};

export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });
};
