import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  CategoriesQueryParams, 
  CategoriesFilters, 
  CategoriesOrderBy,
  CategoriesListResult,
  defaultCategoriesQueryParams,
  defaultCategoriesFilters,
} from '../types/Categories.type';
import { getCategoriesList } from '../services/Categories.service';
import { adaptCategoriesList } from '../adapters/categories.adapter';

export const useCategories = () => {
  // Data state
  const [result, setResult] = useState<CategoriesListResult>({
    categories: [],
    pagination: { page: 1, size: 20, total: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search input state (separado del query)
  const [searchInput, setSearchInput] = useState('');

  // Query params state
  const [queryParams, setQueryParams] = useState<CategoriesQueryParams>(
    defaultCategoriesQueryParams
  );

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getCategoriesList(queryParams);
      const adapted = adaptCategoriesList(response);
      
      setResult(adapted);
    } catch (err: any) {
      const errorMessage = err.message || 'Error al cargar categorías';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  // Initial fetch and refetch on params change
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handlers
  const handleSearchInputChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const executeSearch = useCallback(() => {
    setQueryParams((prev) => ({ ...prev, search: searchInput, page: 1 }));
  }, [searchInput]);

  const handleOrderChange = useCallback((order: CategoriesOrderBy) => {
    setQueryParams((prev) => ({ ...prev, order }));
  }, []);

  const handleFiltersChange = useCallback((filters: CategoriesFilters) => {
    setQueryParams((prev) => ({ ...prev, filters, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setQueryParams((prev) => ({ ...prev, size, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setQueryParams((prev) => ({ ...prev, filters: defaultCategoriesFilters, page: 1 }));
  }, []);

  const hasActiveFilters = useCallback(() => {
    const { filters } = queryParams;
    return (
      filters.minProducts !== null ||
      filters.maxProducts !== null ||
      filters.hasDescription !== null ||
      filters.hasImage !== null ||
      filters.isParent !== null
    );
  }, [queryParams]);

  return {
    // Data
    categories: result.categories,
    pagination: result.pagination,
    loading,
    error,
    
    // Query params
    searchInput,
    order: queryParams.order,
    filters: queryParams.filters,
    page: queryParams.page,
    pageSize: queryParams.size,
    
    // Handlers
    handleSearchInputChange,
    executeSearch,
    handleOrderChange,
    handleFiltersChange,
    handlePageChange,
    handlePageSizeChange,
    clearFilters,
    hasActiveFilters,
    reload: fetchCategories,
  };
};
