import { useState, useEffect } from "react";
import { Category, CategoryFilters, CategoryPayload, SimpleCategory } from "../types/Categories.types";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { categoryApi, categoriesListApi, createCategoryApi, updateCategoryApi } from "../services/Categories.service";
import { categoryAdapter } from "../adapters/Category.adapter";
import { useDebounce } from "@/shared/hooks/useDebounce";

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesList, setCategoriesList] = useState<SimpleCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });
  const [isOpenFilterModal, setIsOpenFilterModal] = useState(false);
  const [filters, setFilters] = useState<CategoryFilters>({
    page: 1,
    size: 20,
    search: null,
    description: null,
    parentcategory: null,
    minproducts: null,
    maxproducts: null,
    order: null,
    image: null,
  });

  const loadData = async (filtersObj?: CategoryFilters) => {
    setLoading(true);
    setError(null);

    try {
      const activeFilters = filtersObj || filters;
      const dataCategory = await categoryApi(activeFilters);
      const { data, pagination: newPagination } = categoryAdapter(dataCategory);

      setCategories(data);
      setPagination(newPagination);
      console.log(newPagination);
    } catch (error) {
      console.error(error);
      setError("Ocurrió un error al cargar datos de categorías");
    } finally {
      setLoading(false);
    }
  };

  const loadCategoriesList = async () => {
    try {
      const data = await categoriesListApi();
      setCategoriesList(data);
    } catch (error) {
      console.error("Error loading categories list:", error);
    }
  };

  useEffect(() => {
    loadData();
    loadCategoriesList();
  }, []);

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters((prev) => {
        const newFilters = { ...prev, search: debouncedSearch || null, page: 1 };
        loadData(newFilters);
        return newFilters;
      });
    }
  }, [debouncedSearch]);

  const onSearchChange = (value: string) => {
    setSearch(value);
  };

  const onPageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, p_page: page }));
    setFilters((prev) => {
      const newFilters = { ...prev, page };
      loadData(newFilters);
      return newFilters;
    });
  };

  const handlePageSizeChange = (size: number) => {
    setPagination((prev) => ({ ...prev, p_size: size, p_page: 1 }));
    setFilters((prev) => {
      const newFilters = { ...prev, size, page: 1 };
      loadData(newFilters);
      return newFilters;
    });
  };

  const onOrderChange = (order: string) => {
    const orderValue = order === "none" ? null : order;
    setFilters((prev) => {
      const newFilters = { ...prev, order: orderValue, page: 1 };
      loadData(newFilters);
      console.log(newFilters);
      return newFilters;
    });
  };

  const onOpenFilterModal = () => {
    setIsOpenFilterModal(true);
  };

  const onCloseFilterModal = () => {
    setIsOpenFilterModal(false);
  };

  const onApplyFilter = (newFilters: CategoryFilters) => {
    if (newFilters.search === null && search !== "") {
      setSearch("");
    }

    setPagination((prev) => ({ ...prev, p_page: 1 }));
    setFilters((prev) => {
      const updatedFilters = { ...newFilters, page: 1, size: prev.size };
      loadData(updatedFilters);
      return updatedFilters;
    });
    setIsOpenFilterModal(false);
  };

  const createCategory = async (payload: CategoryPayload) => {
    await createCategoryApi(payload);
    await Promise.all([loadData(), loadCategoriesList()]);
  };

  const updateCategory = async (payload: CategoryPayload) => {
    await updateCategoryApi(payload);
    await Promise.all([loadData(), loadCategoriesList()]);
  };

  return {
    categories,
    categoriesList,
    loading,
    error,
    search,
    pagination,
    isOpenFilterModal,
    filters,
    onSearchChange,
    onPageChange,
    handlePageSizeChange,
    onOrderChange,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
    loadData,
    setCategories,
    createCategory,
    updateCategory,
  };
};
