export interface ProductApiResponse {
  data: Array<{
    categories: string;
    estado: boolean;
    image_url: string;
    name: string;
    price: string;
    product_id: number;
    terminos: string;
    web: boolean;
    stock: number;
  }>;
  page: {
    p_page: number;
    p_size: number;
    total: number;
  };
}

export interface Variation {
  id: number;
  sku: string | null;
  price: string;
  sale_price: string | null;
  stock: number;
  attributes?: Record<string, string>;
}

export interface Product {
  id: number;
  categories: string[];
  estatus: boolean;
  web: boolean;
  image: string;
  name: string;
  price: string;
  terms: string;
  stock: number;
  is_variable?: boolean;
  variations?: Variation[];
}

export interface Pagination {
  total_items: number;
}

export interface ProductFilters {
  minprice?: number;
  maxprice?: number;
  category?: number;
  status?: boolean;
  web?: boolean;
  minstock?: number;
  maxstock?: number;
  order?: string;
  search?: string;
  page?: number;
  size?: number;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  parent_id: number | null;
  created_at?: string;
}

export interface CategoryProductCount {
  category_id: number;
  product_count: number;
}
