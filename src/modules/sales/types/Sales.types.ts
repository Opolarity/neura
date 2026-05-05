// Sales List Types

export interface SaleListItemApi {
  id: number;
  date: string;
  document_number: string;
  customer_name: string;
  customer_lastname: string | null;
  sale_type_name: string | null;
  situation_name: string | null;
  status_code: string | null;
  total: number;
}

export interface SaleListItem {
  id: number;
  date: string;
  documentNumber: string;
  customerName: string;
  customerLastname: string;
  saleTypeName: string;
  situationName: string;
  statusCode: string;
  total: number;
}

export interface SalesFilters {
  search: string | null;
  situationId: number | null;
  saleType: number | null;
  startDate: string | null;
  endDate: string | null;
  order: string;
  page: number;
  size: number;
}

export interface SalesApiResponse {
  page: {
    page: number;
    size: number;
    total: number;
  };
  data: SaleListItemApi[];
}

export interface SalesPaginationState {
  p_page: number;
  p_size: number;
  total: number;
}

export interface SaleType {
  id: number;
  name: string;
}

export interface SaleSituation {
  id: number;
  name: string;
}

// Sale returns
export interface SaleReturnPayment {
  id: number;
  amount: number;
  movement_id: number;
  voucher_url: string | null;
  payment_date: string;
  payment_method_id: number;
  payment_method_code: string;
  payment_method_name: string;
}

export interface SaleReturnProduct {
  id: number;
  sku: string;
  output: boolean;
  product_name: string;
  order_quantity: number | null;
  original_price: number | null;
  product_amount: number;
  return_quantity: number;
  variation_terms: string[];
  order_product_id: number | null;
  original_discount: number | null;
  stock_movement_id: number;
  product_variation_id: number;
  original_order_quantity: number | null;
}

export interface SaleReturn {
  id: number;
  reason: string;
  order_id: number;
  payments: SaleReturnPayment[];
  products: SaleReturnProduct[];
  module_id: number;
  status_id: number;
  created_at: string;
  created_by: string;
  status_code: string;
  status_name: string;
  situation_id: number;
  return_type_id: number;
  situation_code: string;
  situation_name: string;
  shipping_return: boolean;
  parent_return_id: number | null;
  return_type_code: string;
  return_type_name: string;
  order_situation_id: number | null;
  order_situation_code: string | null;
  total_refund_amount: number;
  customer_document_number: string;
  customer_document_type_id: number;
  total_exchange_difference: number;
}
