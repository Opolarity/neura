export interface ProductApiResponse {
  data: {
    product_id: number;
    categories: string;
    estado: boolean;
    web: boolean;
    image_url: string;
    name: string;
    price: string;
    terminos: "";
  }[];
  pagination: {
    p_page: number;
    p_size: number;
    total: number;
  }[];
}

export interface Product {
  product_id: number;
  categories: string;
  estado: boolean;
  web: boolean;
  image_url: string;
  name: string;
  price: string;
  terminos: "";
}

export interface Pagination {
  p_page: number;
  p_size: number;
  total: number;
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
