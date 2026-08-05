import type {
  ProductVariationsApiResponse,
  ProductVariationsPage,
} from "./ProductVariationSelector.types";

export const productVariationsFromApiAdapter = (
  raw: ProductVariationsApiResponse,
): ProductVariationsPage => ({
  data: (raw.data || []).map((p) => ({
    id: p.variationId,
    sku: p.sku,
    productId: p.productId,
    productTitle: p.productTitle,
    imageUrl: p.imageUrl ?? null,
    stock: p.stock ?? 0,
    terms: p.terms,
    prices: p.prices.map((pr) => ({
      priceListId: pr.price_list_id,
      price: pr.price,
      salePrice: pr.sale_price,
    })),
  })),
  pagination: raw.page,
});
