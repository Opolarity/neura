import type {
  POSSessionDetail,
  POSSessionOrder,
  POSSessionPaymentItem,
  POSSessionDetailApiResponse,
} from "../types/POSDetail.types";

export const adaptPOSSessionDetail = (
  response: POSSessionDetailApiResponse
): { session: POSSessionDetail; orders: POSSessionOrder[]; incomePayments: POSSessionPaymentItem[]; changePayments: POSSessionPaymentItem[]; totalIngresos: number; totalVueltos: number } => {
  const s = response.session;
  return {
    session: {
      id: s.id,
      userId: s.user_id,
      userName: s.user_name,
      branchId: s.branch_id,
      branchName: s.branch_name,
      warehouseId: s.warehouse_id,
      warehouseName: s.warehouse_name,
      openingAmount: s.opening_amount,
      closingAmount: s.closing_amount,
      expectedAmount: s.expected_amount,
      totalSales: s.total_sales,
      difference: s.difference,
      openingDifference: s.opening_difference,
      otherMovements: s.other_movements ?? 0,
      otherIngresos: s.other_ingresos ?? 0,
      otherEgresos: s.other_egresos ?? 0,
      statusId: s.status_id,
      statusName: s.status_name,
      statusCode: s.status_code,
      openedAt: s.opened_at,
      closedAt: s.closed_at,
      notes: s.notes,
    },
    orders: (response.orders || []).map((o) => ({
      orderId: o.order_id,
      customerName: o.customer_name,
      documentNumber: o.document_number,
      total: o.total,
      subtotal: o.subtotal,
      discount: o.discount,
      createdAt: o.created_at,
    })),
    incomePayments: response.income_payments || [],
    changePayments: response.change_payments || [],
    totalIngresos: response.total_ingresos,
    totalVueltos: response.total_vueltos,
  };
};
