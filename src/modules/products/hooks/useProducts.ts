// modules/products/hooks/useProducts.ts
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts } from "../store/products";
import { Product, Pagination, ProductFilters } from "../products.types";

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    size: 20,
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const navigate = useNavigate();

  const loadData = async (currentFilters: ProductFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getProducts({
        ...currentFilters,
        search: search || undefined,
      });
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
    const handler = setTimeout(() => {
      loadData(filters);
    }, 500);

    return () => clearTimeout(handler);
  }, [filters, search]);

  const goToProductDetail = (id: number) => {
    navigate(`/producto/${id}`);
  };

  const onSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleOpenFilter = () => setIsFilterModalOpen(true);
  const handleCloseFilter = () => setIsFilterModalOpen(false);

  const handleApplyFilters = (newFilters: ProductFilters) => {
    setFilters({ ...newFilters, page: 1, size: filters.size });
    setIsFilterModalOpen(false);
  };

  const handleClearFilters = () => {
    setFilters({ page: 1, size: 20 });
    setIsFilterModalOpen(false);
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setFilters((prev) => ({ ...prev, size: newSize, page: 1 }));
  };

  return {
    products,
    pagination,
    loading,
    error,
    search,
    filters,
    isFilterModalOpen,
    goToProductDetail,
    onSearchChange,
    handleOpenFilter,
    handleCloseFilter,
    handleApplyFilters,
    handleClearFilters,
    handlePageChange,
    handlePageSizeChange,
    refresh: () => loadData(filters),
  };
};
