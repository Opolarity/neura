// =============================================
// POS Sessions List Adapter
// =============================================

import type {
  POSSessionListItem,
  POSSessionListApiItem,
  POSSessionsListApiResponse,
} from "../types/POSList.types";
import { PaginationState } from "@/shared/components/pagination/Pagination";

export const adaptPOSSessionListItem = (
  item: POSSessionListApiItem
): POSSessionListItem => ({
  id: item.id,
  userId: item.user_id,
  userName: item.user_name,
  branchId: item.branch_id,
  branchName: item.branch_name,
  openingDifference: item.opening_difference ?? null,
  warehouseId: item.warehouse_id,
  warehouseName: item.warehouse_name,
  openingAmount: item.opening_amount,
  closingAmount: item.closing_amount,
  expectedAmount: item.expected_amount,
  totalSales: item.total_sales,
  difference: item.difference,
  statusId: item.status_id,
  statusName: item.status_name,
  statusCode: item.status_code,
  openedAt: item.opened_at,
  closedAt: item.closed_at,
  notes: item.notes,
});

export const adaptPOSSessionsList = (
  response: POSSessionsListApiResponse
): { sessions: POSSessionListItem[]; pagination: PaginationState } => {
  const { data, page } = response.sessions_data;
  return {
    sessions: (data || []).map(adaptPOSSessionListItem),
    pagination: {
      p_page: page.p_page,
      p_size: page.p_size,
      total: page.total,
    },
  };
};
