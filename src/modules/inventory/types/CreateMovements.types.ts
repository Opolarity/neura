export interface CMovementsProductsApiResponse {
  data: Array<{
    sku: string;
    stock: number;
    terms: Array<{ id: number; name: string }>;
    prices: Array<{
      price: number;
      sale_price: number | null;
      price_list_id: number;
    }>;
    imageUrl: string;
    productId: number;
    variationId: number;
    productTitle: string;
  }>;
  page: {
    page: number;
    size: number;
    total: number;
  };
}

export interface CMovementsFilters {}
