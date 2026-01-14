export interface ProductCostsApiResponse {
  products: {
    data: Array<{
      sku: string;
      cost: number;
      name: string;
      term: string;
      variation_id: number;
    }>;
    page: {
      page: number;
      size: number;
      total: number;
    };
  };
}

export interface ProductCost {
  sku: string;
  cost: number;
  name: string;
  term: string;
  variation_id: number;
}

export interface ProductCostsFilters {
  p_variation?: number | null;
  min_cost?: number | null;
  max_cost?: number | null;
  order?: string | null;
  search?: string | null;
  page?: number;
  size?: number;
}

//PaginationState, se usa el de products
