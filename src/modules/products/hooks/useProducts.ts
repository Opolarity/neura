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
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [startRecord, setStartRecord] = useState(0);
  const [endRecord, setEndRecord] = useState(0);

  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { products, pagination } = await getProducts();
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

  const onPageChange = () => {};

  return {
    products,
    pagination,
    loading,
    error,
    search,
    page,
    totalPages,
    startRecord,
    endRecord,
    onPageChange,
    goToProductDetail,
    onSearchChange,
  };
};
