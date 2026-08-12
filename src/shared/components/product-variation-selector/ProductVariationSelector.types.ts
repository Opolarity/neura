export interface ProductVariationOption {
  id: number;
  sku: string;
  productId: number;
  productTitle: string;
  imageUrl: string | null;
  stock: number;
  terms: Array<{ id: number; name: string }>;
  prices: Array<{
    priceListId: number;
    price: number;
    salePrice: number | null;
  }>;
}

/**
 * Unidad que devuelve el selector:
 * - "variation": cada item es una variación (`id` = variationId). Comportamiento
 *   histórico, usado por el punto de venta y por el regalo de las reglas.
 * - "product": cada item es un producto (`id` = productId). Usado donde se
 *   persiste el id del producto, como las condiciones de reglas de precios.
 */
export type ProductSelectorMode = "variation" | "product";

export interface FetchProductVariationsParams {
  page?: number;
  size?: number;
  search?: string;
  stockTypeId?: number;
  warehouseId?: number;
}

export interface FetchProductsParams {
  page?: number;
  size?: number;
  search?: string;
  /** Devuelve solo estos productos (ignora `search`). Para rehidratar nombres de ids guardados. */
  ids?: number[];
}

export interface ProductVariationsApiResponse {
  data: Array<{
    productId: number;
    productTitle: string;
    variationId: number;
    sku: string;
    imageUrl: string | null;
    stock: number;
    terms: Array<{ id: number; name: string }>;
    prices: Array<{
      price_list_id: number;
      price: number;
      sale_price: number | null;
    }>;
  }>;
  page: {
    page: number;
    size: number;
    total: number;
  };
}

export interface ProductsApiResponse {
  data: Array<{
    productId: number;
    productTitle: string;
    sku: string | null;
    imageUrl: string | null;
    variationCount: number;
  }>;
  page: {
    page: number;
    size: number;
    total: number;
  };
}

export interface ProductVariationsPage {
  data: ProductVariationOption[];
  pagination: {
    page: number;
    size: number;
    total: number;
  };
}
