export interface ProductApiResponse {
  products: {
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

export interface Pagination {
  total_items: number;
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
