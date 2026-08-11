import type {
  ProductVariationsApiResponse,
  ProductsApiResponse,
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

// Los productos se mapean a la misma forma que las variaciones para que el
// popover renderice ambos modos sin bifurcarse. `id` es el productId, y los
// campos propios de la variación quedan vacíos.
export const productsFromApiAdapter = (
  raw: ProductsApiResponse,
): ProductVariationsPage => ({
  data: (raw.data || []).map((p) => ({
    id: p.productId,
    sku: p.sku ?? "",
    productId: p.productId,
    productTitle: p.productTitle,
    imageUrl: p.imageUrl ?? null,
    stock: 0,
    terms: [],
    prices: [],
  })),
  pagination: raw.page,
});
