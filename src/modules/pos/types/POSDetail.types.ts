// =============================================
// POS Session Detail Types
// =============================================

export interface POSSessionDetail {
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
  openingDifference: number;
  statusId: number;
  statusName: string;
  statusCode: string;
  openedAt: string;
  closedAt: string | null;
  notes: string | null;
}

export interface POSSessionOrder {
  orderId: number;
  customerName: string;
  documentNumber: string;
  total: number;
  subtotal: number;
  discount: number;
  createdAt: string;
}

export interface POSSessionDetailApiResponse {
  session: {
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
    opening_difference: number;
    status_id: number;
    status_name: string;
    status_code: string;
    opened_at: string;
    closed_at: string | null;
    notes: string | null;
  };
  orders: {
    order_id: number;
    customer_name: string;
    document_number: string;
    total: number;
    subtotal: number;
    discount: number;
    created_at: string;
  }[];
}
