export interface ProductApiResponse {
  productsdata: {
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
  };
}

export interface Product {
  id: number;
  categories: string;
  estatus: boolean;
  web: boolean;
  image: string;
  name: string;
  price: string;
  terms: string;
  stock: number;
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

export interface CategoryApiResponse {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
}

export type Categories = Category[];
export type CategoriesApiResponse = CategoryApiResponse[];

export interface PaginationState {
  p_page: number | null;
  p_size: number | null;
  total: number | null;
}

export interface ProductData {
  id: number;
  title: string;
  categories: string[];
  estado: boolean;
  web: boolean;
  image_url: string;
  price: string;
  terminos: string;
  variations: {
    prices: { price: number | null; sale_price: number | null }[];
    stock: { stock: number | null }[];
  }[];
}
