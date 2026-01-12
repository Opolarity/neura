// modules/products/hooks/useProducts.ts
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Product, Pagination } from "../products.types";
import { productsApi } from "../services/products.service";
import { productAdapter } from "../adapters/product.adapter";

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productsApi();
      const { products, pagination } = productAdapter(data);
      setProducts(products);
      setPagination(pagination);
    } catch {
      setError("Ocurrió un error al cargar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const goToProductDetail = (id: number) => {
    navigate(`/producto/${id}`);
  };

  const onSearchChange = (value: string) => {
    setSearch(value);
  };

  return {
    products,
    pagination,
    loading,
    error,
    search,
    goToProductDetail,
    onSearchChange,
  };
};
