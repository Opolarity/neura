import {
  ProductCost,
  ProductCostsApiResponse,
} from "../types/ProductCosts.types";
import { PaginationState } from "../types/Products.types";

export const productCostsAdapter = (response: ProductCostsApiResponse) => {
  const formattedProductCosts: ProductCost[] = response.products.data.map(
    (item) => ({
      sku: item.sku,
      cost: item.cost,
      name: item.name,
      term: item.term,
      variation_id: item.variation_id,
    })
  );

  const pagination: PaginationState = {
    p_page: response.products.page.page,
    p_size: response.products.page.size,
    total: response.products.page.total,
  };

  return { products: formattedProductCosts, pagination };
};
