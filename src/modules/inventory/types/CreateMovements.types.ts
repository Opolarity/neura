export interface CMovementsProductsApiResponse {
  data: Array<{
    sku: string;
    stock: number;
    terms: Array<{ id: number; name: string }>;
    prices: Array<{
      price: number;
      sale_price: number | null;
      price_list_id: number;
    }>;
    imageUrl: string;
    productId: number;
    variationId: number;
    productTitle: string;
  }>;
  page: {
    page: number;
    size: number;
    total: number;
  };
}

export interface CMovementsProducts {
  sku: string;
  stock: number;
  terms: Array<{ id: number; name: string }>;
  imageUrl: string;
  productId: number;
  variationId: number;
  productTitle: string;
}

export interface CMProductsFilter {
  p_page?: number;
  p_size?: number;
  p_search?: string | null;
  p_stock_type_id?: number | null;
  p_warehouse_id?: number | null;
}

export interface CMovementsFilters {
  p_warehouse_id?: number | null;
}

export interface UserSummaryApiResponse {
  warehouse_id: number;
  warehouses: {
    id: number;
    name: string;
  };
  accounts: {
    name: string;
    last_name: string;
    last_name2: string;
  };
}

export interface UserSummary {
  warehouse_id: number;
  warehouse_name: string;
  account_name: string;
  account_last_name: string;
  account_last_name2: string;
}
