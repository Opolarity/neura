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

export interface FetchProductVariationsParams {
  page?: number;
  size?: number;
  search?: string;
  stockTypeId?: number;
  warehouseId?: number;
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

export interface ProductVariationsPage {
  data: ProductVariationOption[];
  pagination: {
    page: number;
    size: number;
    total: number;
  };
}
