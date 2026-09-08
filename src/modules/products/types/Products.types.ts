interface ProductsData {
  data: Array<{
    categories: string;
    estado: boolean;
    image_url: string | null;
    name: string;
    price: string;
    product_id: number;
    terminos: string;
    web: boolean;
    stock: number;
    /** T-269 · Variaciones del producto bajo el umbral global (definición única). */
    low_stock_variations?: number | null;
  }>;
  page: {
    p_page: number;
    p_size: number;
    total: number;
  };
}

export interface ProductApiResponse {
  productsdata: ProductsData | { productsdata: ProductsData };
}

export interface Product {
  id: number;
  categories: string;
  estatus: boolean;
  web: boolean;
  image: string | null;
  name: string;
  price: string;
  terms: string;
  /**
   * Stock por PRODUCTO, solo del almacén del usuario y sin filtrar stock_type
   * (lo calcula get_products_list). NO es comparable con el umbral global: por
   * eso el indicador de stock bajo cuelga de `lowStockVariations`.
   */
  stock: number;
  /** T-269 · Cuántas variaciones de este producto están bajo el umbral global. */
  lowStockVariations: number;
}

export interface ProductFilters {
  minprice?: number;
  maxprice?: number;
  /** Ids de las categorías marcadas. Vacío = todas (sin filtro). */
  category_ids?: number[];
  status?: boolean;
  web?: boolean;
  minstock?: number;
  maxstock?: number;
  order?: string;
  search?: string;
  /** Id de etiqueta (tags.type = 'tag'). */
  tag?: number;
  /** Id de marca (tags.type = 'brand'). */
  brand?: number;
  /** Nombres que espera la edge function; se derivan de tag/brand al enviar. */
  tag_id?: number;
  brand_id?: number;
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
