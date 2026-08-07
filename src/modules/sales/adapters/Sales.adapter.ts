import {
  SalesApiResponse,
  SaleListItem,
  SalesPaginationState,
} from "../types/Sales.types";
import type { SalePaymentStatus } from "../utils/salePaymentStatus";

// Solo se aceptan los dos valores conocidos; cualquier otro queda undefined
// para que la celda muestre "—" en vez de un estado inventado.
const adaptPaymentStatus = (
  value: string | null | undefined,
): SalePaymentStatus | undefined =>
  value === "paid" || value === "pending" ? value : undefined;

export const salesListAdapter = (
  response: SalesApiResponse
): { sales: SaleListItem[]; pagination: SalesPaginationState } => {
  return {
    sales: response.data.map((item) => ({
      id: item.id,
      date: item.date,
      documentNumber: item.document_number,
      customerName: item.customer_name || "",
      customerLastname: item.customer_lastname || "",
      saleTypeName: item.sale_type_name || "",
      situationName: item.situation_name || "",
      statusCode: item.status_code || "",
      total: item.total,
      paymentStatus: adaptPaymentStatus(item.payment_status),
    })),
    pagination: {
      p_page: response.page.page,
      p_size: response.page.size,
      total: response.page.total,
    },
  };
};
