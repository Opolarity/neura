import {
  SalesApiResponse,
  SaleListItem,
  SalesPaginationState,
} from "../types/Sales.types";

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
    })),
    pagination: {
      p_page: response.page.page,
      p_size: response.page.size,
      total: response.page.total,
    },
  };
};
