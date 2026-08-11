export interface CategoryOption {
  id: number;
  name: string;
}

export interface FetchCategoriesParams {
  page?: number;
  size?: number;
  search?: string;
  /** Devuelve solo estas categorías (ignora `search`). Para rehidratar nombres de ids guardados. */
  ids?: number[];
}

export interface CategoriesApiResponse {
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

export interface CategoriesPage {
  data: CategoryOption[];
  pagination: {
    page: number;
    size: number;
    total: number;
  };
}
