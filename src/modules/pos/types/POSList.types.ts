// =============================================
// POS Sessions List Types
// =============================================

export interface POSSessionListItem {
  id: number;
  userId: string;
  userName: string;
  branchId: number;
  branchName: string;
  warehouseId: number;
  warehouseName: string;
  openingAmount: number;
  closingAmount: number | null;
  expectedAmount: number | null;
  totalSales: number | null;
  difference: number | null;
  statusId: number;
  statusName: string;
  statusCode: string;
  openedAt: string;
  closedAt: string | null;
  notes: string | null;
}

export interface POSSessionListApiItem {
  id: number;
  user_id: string;
  user_name: string;
  branch_id: number;
  branch_name: string;
  warehouse_id: number;
  warehouse_name: string;
  opening_amount: number;
  closing_amount: number | null;
  expected_amount: number | null;
  total_sales: number | null;
  difference: number | null;
  status_id: number;
  status_name: string;
  status_code: string;
  opened_at: string;
  closed_at: string | null;
  notes: string | null;
}

export interface POSSessionsListApiResponse {
  sessions_data: {
    data: POSSessionListApiItem[];
    page: {
      p_page: number;
      p_size: number;
      total: number;
    };
  };
}

export interface POSSessionsListFilters {
  search: string | null;
  status_id: number | null;
  page: number;
  size: number;
}
