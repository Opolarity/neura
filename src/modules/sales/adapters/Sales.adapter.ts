import {
  SalesApiResponse,
  SaleListItem,
  SalesPaginationState,
} from "../types/Sales.types";
import { getSalePaymentStatusFromAmounts } from "../utils/salePaymentStatus";

export const salesListAdapter = (
  response: SalesApiResponse
): { sales: SaleListItem[]; pagination: SalesPaginationState } => {
  return {
    sales: response.data.map((item) => {
      const total = Number(item.total) || 0;
      const totalPaid = Number(item.total_paid) || 0;

      return {
        id: item.id,
        date: item.date,
        documentNumber: item.document_number,
        customerName: item.customer_name || "",
        customerLastname: item.customer_lastname || "",
        saleTypeName: item.sale_type_name || "",
        situationName: item.situation_name || "",
        statusCode: item.status_code || "",
        total,
        totalPaid,
        // El estado de pago se calcula aquí, no se toma del backend.
        paymentStatus: getSalePaymentStatusFromAmounts(totalPaid, total),
      };
    }),
    pagination: {
      p_page: response.page.page,
      p_size: response.page.size,
      total: response.page.total,
    },
  };
};
