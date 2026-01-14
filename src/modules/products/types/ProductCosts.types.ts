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
  variation?: number | null;
  mincost?: number | null;
  maxcost?: number | null;
  order?: string | null;
  search?: string | null;
  page?: number;
  size?: number;
  cost?: boolean | null;
}

//PaginationState, se usa el de products
