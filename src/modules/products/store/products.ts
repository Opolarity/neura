import { productAdapter } from "../adapters/product.adapter";
import { productsApi } from "../services/products.service";
import { ProductFilters } from "../products.types";

export const getProducts = async (filters: ProductFilters = {}) => {
  try {
    const data = await productsApi(filters);
    return productAdapter(data);
  } catch (error: any) {
    console.error("Store error:", error);
    throw error;
  }
};
