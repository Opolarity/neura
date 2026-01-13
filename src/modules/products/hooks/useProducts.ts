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
import { ClientsFilters } from "@/modules/customers/types";
import { PaginationType } from "@/types";

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [pagination, setPagination] = useState<PaginationType>({
      page: 1,
      size: 20,
      total: 0,
  });
  const [totalPages, setTotalPages] = useState(0);
  const [startRecord, setStartRecord] = useState(0);
  const [endRecord, setEndRecord] = useState(0);
  const [isOpenFilterModal, setIsOpenFilterModal] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>({
    minprice: null,
    maxprice: null,
    category: null,
    status: null,
    web: null,
    minstock: null,
    maxstock: null,
    order: null,
    search: null,
    page: 1,
    size: 20,
  });

  // Estado temporal del formulario de filtros
  const [tempFilters, setTempFilters] = useState<ProductFilters>(filters);

  const navigate = useNavigate();

  const loadData = async (filters?: ProductFilters) => {
    setLoading(true);
    setError(null);

    try {
      if (!filters) {
        const dataProducts = await productsApi();
        const { products, pagination } = productAdapter(dataProducts);
        setProducts(products);
        setPagination(pagination);
      } else {
        const dataProducts = await productsApi(filters);
        const { products, pagination } = productAdapter(dataProducts);
        setProducts(products);
        setPagination(pagination);
      }

      const dataCategories = await categoriesApi();
      const categoriesResponse = categoryAdapter(dataCategories);

      setCategories(categoriesResponse);
    } catch {
      setError("Ocurrió un error al cargar datos de productos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(filters);
  }, [filters]);

  const goToProductDetail = (id: number) => {
    navigate(`/producto/${id}`);
  };

  const onSearchChange = (value: string) => {
    setSearch(value);
  };

  // Actualizar filtro temporal
  const updateTempFilter = <K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K]
  ) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };

// src/modules/products/hooks/useProducts.ts
const onPageChange = (page: number) => {
  setFilters(prev => ({ ...prev, page }));
};

  const onOpenFilterModal = () => {
    setIsOpenFilterModal(true);
  };
  const onCloseFilterModal = () => {
    setIsOpenFilterModal(false);
  };

  const handlePageSizeChange = (size: number) => {
    setFilters(prev => ({ ...prev, size, page: 1 }));
  };

  const onApplyFilter = (newFilters: ProductFilters) => {
    setFilters({ ...newFilters, page: 1, size: filters.size });
    setIsOpenFilterModal(false);
  }; 

  return {
    products,
    categories,
    pagination,
    loading,
    error,
    search,
    totalPages,
    startRecord,
    endRecord,
    isOpenFilterModal,
    filters,
    onPageChange,
    goToProductDetail,
    updateTempFilter,
    onSearchChange,
    onOpenFilterModal,
    onCloseFilterModal,
    handlePageSizeChange,
    tempFilters,
    onApplyFilter,
  };
};
