// ===== API Response Types =====
export interface ClientsApiResponse {
  page: {
    page: number;
    size: number;
    total: number;
  };
  data: ClientApiData[];
}

export interface ClientApiData {
  id: number;
  name: string;
  middle_name: string | null;
  last_name: string;
  last_name2: string | null;
  document_number: string;
  created_at: string;
  purchase_count: number;
  total_amount: number;
}

// ===== UI Types =====
export interface Client {
  id: number;
  fullName: string;
  documentNumber: string;
  purchaseCount: number;
  totalAmount: number;
  createdAt: string;
}

export interface ClientsPagination {
  page: number;
  size: number;
  total: number;
}

// ===== Filter Types =====
export interface ClientsFilters {
  minPurchases: number | null;
  maxPurchases: number | null;
  minAmount: number | null;
  maxAmount: number | null;
  dateFrom: string | null;
  dateTo: string | null;
}

export type ClientsOrderBy = 
  | 'date-asc' 
  | 'date-desc' 
  | 'amount-asc' 
  | 'amount-desc' 
  | 'purchases-asc' 
  | 'purchases-desc';

export interface ClientsQueryParams {
  search: string;
  filters: ClientsFilters;
  order: ClientsOrderBy;
  page: number;
  size: number;
}
