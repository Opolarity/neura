export interface StockTypeApiResponse {
  data: Array<{
    id: number;
    name: string;
  }>;
  page: {
    page: number;
    size: number;
    total: number;
  };
}

export interface StockType {
  id: number;
  name: string;
}

export interface StockTypeFilters {
  page?: number;
  size?: number;
}

export interface StockTypePayload {
  id?: number;
  name: string;
  code: string;
}
