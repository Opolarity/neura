// ===== API Response Types (from stored procedure) =====

export interface CategoriesApiResponse {
  page: CategoriesApiPagination;
  data: CategoryApiData[];
}

export interface CategoriesApiPagination {
  page: number;
  size: number;
  total: number;
}

export interface CategoryApiData {
  id_category: number;
  imagen: string | null;
  nombre: string;
  categoria_padre: string | null;
  descripcion: string;
  productos: number;
}

// ===== UI Types (camelCase for frontend) =====

export interface Category {
  id: number;
  imageUrl: string | null;
  name: string;
  parentCategory: string | null;
  description: string;
  productCount: number;
}

export interface CategoriesPagination {
  page: number;
  size: number;
  total: number;
}

export interface CategoriesFilters {
  minProducts: number | null;
  maxProducts: number | null;
  hasDescription: boolean | null;
  hasImage: boolean | null;
  isParent: boolean | null;
}

export type CategoriesOrderBy = 'alp-asc' | 'alp-dsc' | 'prd-asc' | 'prd-dsc';

export interface CategoriesQueryParams {
  search: string;
  page: number;
  size: number;
  order: CategoriesOrderBy;
  filters: CategoriesFilters;
}

export interface CategoriesListResult {
  categories: Category[];
  pagination: CategoriesPagination;
}

// ===== Default values =====

export const defaultCategoriesFilters: CategoriesFilters = {
  minProducts: null,
  maxProducts: null,
  hasDescription: null,
  hasImage: null,
  isParent: null,
};

export const defaultCategoriesQueryParams: CategoriesQueryParams = {
  search: '',
  page: 1,
  size: 20,
  order: 'alp-asc',
  filters: defaultCategoriesFilters,
};
