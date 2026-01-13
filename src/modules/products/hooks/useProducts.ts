// modules/products/hooks/useProducts.ts
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Product,
  Pagination,
  ProductFilters,
  Category,
} from "../types/Products.types";
import { categoriesApi, productsApi } from "../services/products.service";
import { categoryAdapter, productAdapter } from "../adapters/product.adapter";

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [startRecord, setStartRecord] = useState(0);
  const [endRecord, setEndRecord] = useState(0);
  const [isOpenFilterModal, setIsOpenFilterModal] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>({
    minprice: undefined,
    maxprice: undefined,
    category: undefined,
    status: undefined,
    web: undefined,
    minstock: undefined,
    maxstock: undefined,
    order: undefined,
    search: undefined,
    page: undefined,
    size: undefined,
  });

  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const dataProducts = await productsApi();
      const { products, pagination } = productAdapter(dataProducts);

      const dataCategories = await categoriesApi();
      const categoriesResponse = categoryAdapter(dataCategories);

      setProducts(products);
      setCategories(categoriesResponse);
      setPagination(pagination);
    } catch {
      setError("Ocurrió un error al cargar datos de productos");
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

  const onOpenFilterModal = () => {
    setIsOpenFilterModal(true);
  };
  const onCloseFilterModal = () => {
    setIsOpenFilterModal(false);
  };

  const onApplyFilter = (newFilters: ProductFilters) => {
    setFilters({ ...newFilters, page: 1, size: filters.size });
  };

  return {
    products,
    categories,
    pagination,
    loading,
    error,
    search,
    page,
    totalPages,
    startRecord,
    endRecord,
    isOpenFilterModal,
    filters,
    onPageChange,
    goToProductDetail,
    onSearchChange,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
  };
};
