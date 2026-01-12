import { productAdapter } from "../adapters/product.adapter";
import { productsApi } from "../services/products.service";

export const getProducts = async () => {
  try {
    const data = await productsApi();
    console.log(data);
    return productAdapter(data);
  } catch (error) {
    throw new Error("Error fetching products");
  }
};
