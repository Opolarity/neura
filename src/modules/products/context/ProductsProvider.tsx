import { useState, useCallback, ReactNode } from "react";
import { ProductData } from "../types";
import { ProductsContext } from "./ProductContext";
import { getProducts } from "../services";

interface Props {
  children: ReactNode;
}

export function ProductsProvider({ children }: Props) {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getProducts();
      setProducts(response);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <ProductsContext.Provider
      value={{
        products,
        isLoading,
        loadProducts,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}
