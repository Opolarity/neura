// modules/products/hooks/useProducts.ts
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Product,
  ProductFilters,
  Category,
  PaginationState,
} from "../types/Products.types";
import {
  categoriesApi,
  deleteProductApi,
  deleteProductsApi,
  productsApi,
} from "../services/products.service";
import { categoryAdapter, productAdapter } from "../adapters/product.adapter";

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });
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
  const [tempFilters, setTempFilters] = useState<ProductFilters>(filters);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

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

  const deleteSelectedsProduct = async (productIds: number[]) => {
    setLoading(true);
    setError(null);
    try {
      await deleteProductsApi(productIds);
      await loadData();
    } catch (error) {
      setError("Ocurrió un error al eliminar productos");
    } finally {
      setLoading(false);
      setSelectedProducts([]);
    }
  };

  const deleteSelectedProduct = async (productId: number) => {
    setLoading(true);
    setError(null);

    try {
      await deleteProductApi(productId);

      await loadData();
    } catch (error) {
      setError("Ocurrió un error al eliminar productos");
    } finally {
      setLoading(false);
      setSelectedProducts([]);
    }
  };

  useEffect(() => {
    loadData(filters);
  }, [filters]);

  const goToProductDetail = (id: number) => {
    navigate(`/products/add?id=${id}`);
  };
  const goToNewProduct = () => {
    navigate("/products/add");
  };

  const onSearchChange = (value: string) => {
    setSearch(value);
  };
  const updateTempFilter = <K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K]
  ) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const onPageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (size: number) => {
    setFilters((prev) => ({ ...prev, size, page: 1 }));
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((product) => product.id));
    }
    console.log(selectedProducts);
  };

  const toggleProductSelection = (productId: number) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const onOpenFilterModal = () => {
    setIsOpenFilterModal(true);
  };
  const onCloseFilterModal = () => {
    setIsOpenFilterModal(false);
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
    isOpenFilterModal,
    filters,
    tempFilters,
    selectedProducts,
    toggleSelectAll,
    toggleProductSelection,
    deleteSelectedsProduct,
    deleteSelectedProduct,
    onPageChange,
    handlePageSizeChange,
    goToProductDetail,
    goToNewProduct,
    onSearchChange,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
    updateTempFilter,
  };
};
