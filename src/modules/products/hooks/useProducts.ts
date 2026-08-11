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
import { categoryAdapter, productAdapter } from "../adapters/Product.adapter";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { getTags } from "@/shared/services/service";
import type { TagsResponse } from "@/shared/types/type";

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
    tag: null,
    brand: null,
    page: 1,
    size: 20,
  });
  // Catálogo de etiquetas y marcas para los selects del modal de filtros.
  // Ambas salen de la tabla `tags` y se separan por `type`.
  const [tags, setTags] = useState<TagsResponse[]>([]);
  const [brands, setBrands] = useState<TagsResponse[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  const navigate = useNavigate();

  const loadData = async (filters?: ProductFilters) => {
    setLoading(true);
    setError(null);

    try {
      // La edge function espera tag_id / brand_id; se renombran aquí y se
      // quitan los originales para no enviarlos duplicados en la query.
      const { tag, brand, ...rest } = filters ?? {};
      const dataProducts = await productsApi({
        ...rest,
        tag_id: tag ?? null,
        brand_id: brand ?? null,
      });
      const { products, pagination } = productAdapter(dataProducts);
      setProducts(products);
      setPagination(pagination);
    } catch (error) {
      console.error(error);
      setError("Ocurrió un error al cargar datos de productos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const dataCategories = await categoriesApi();
        const categoriesResponse = categoryAdapter(dataCategories);
        setCategories(categoriesResponse);
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const dataTags = await getTags();
        setTags(dataTags.filter((t) => t.type === "tag"));
        setBrands(dataTags.filter((t) => t.type === "brand"));
      } catch (error) {
        console.error("Error loading tags:", error);
      }
    };
    loadTags();
  }, []);

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

  const goToProductDetail = (id: number) => {
    navigate(`/products/edit/${id}`);
  };

  const goToViewProduct = (id: number) => {
    navigate(`/products/view/${id}`);
  };

  const goToNewProduct = () => {
    navigate("/products/add");
  };

  const onSearchChange = (value: string) => {
    setSearch(value);
  };

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      const newFilters = { ...filters, search: debouncedSearch, page: 1 };
      setFilters(newFilters);
      loadData(newFilters);
    }
  }, [debouncedSearch]);

  const onPageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    loadData(newFilters);
  };

  const onOrderChange = (order: string) => {
    const newFilters = { ...filters, order, page: 1 };
    setFilters(newFilters);
    loadData(newFilters);
  };

  const handlePageSizeChange = (size: number) => {
    const newFilters = { ...filters, size, page: 1 };
    setFilters(newFilters);
    loadData(newFilters);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((product) => product.id));
    }
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
    const updatedFilters = { ...newFilters, page: 1, size: filters.size };
    setFilters(updatedFilters);
    loadData(updatedFilters);
    setIsOpenFilterModal(false);
  };

  const hasActiveFilters =
    filters.minprice !== null ||
    filters.maxprice !== null ||
    filters.category !== null ||
    filters.status !== null ||
    filters.web !== null ||
    filters.minstock !== null ||
    filters.maxstock !== null ||
    filters.tag !== null ||
    filters.brand !== null;
  return {
    products,
    categories,
    tags,
    brands,
    pagination,
    loading,
    error,
    search,
    isOpenFilterModal,
    filters,
    selectedProducts,
    hasActiveFilters,
    toggleSelectAll,
    toggleProductSelection,
    deleteSelectedsProduct,
    deleteSelectedProduct,
    onPageChange,
    handlePageSizeChange,
    goToProductDetail,
    goToViewProduct,
    goToNewProduct,
    onSearchChange,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
    onOrderChange,
  };
};
