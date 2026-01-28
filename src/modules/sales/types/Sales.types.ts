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
  status: string | null;
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

export interface SaleStatus {
  code: string;
  name: string;
}
