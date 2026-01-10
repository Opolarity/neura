// modules/products/hooks/useProducts.ts
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts } from "../store/products";
import { Product, Pagination } from "../products.types";

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
      const response = await getProducts();
      setProducts(response.products);
      setPagination(response.pagination);
    } catch (err: any) {
      console.error("Error detallado:", err);
      setError(err.message || "Ocurrió un error al cargar");
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
