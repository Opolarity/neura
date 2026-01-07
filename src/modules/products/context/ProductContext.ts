import { createContext, useContext } from "react";
import { ProductsContextState } from "../types";

export const ProductsContext = createContext<ProductsContextState | undefined>(
  undefined
);

export function useProductsContext(): ProductsContextState {
  const context = useContext(ProductsContext);

  if (!context) {
    throw new Error(
      "useProductsContext must be used within a ProductsProvider"
    );
  }

  return context;
}
