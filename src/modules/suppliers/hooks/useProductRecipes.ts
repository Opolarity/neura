import { useState, useEffect, useCallback } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import {
  ProductRecipe,
  ProductRecipesFilters,
  RecipeStateCounts,
} from "../types/productRecipes.types";
import { productRecipesListApi } from "../services/productRecipes.service";

const EMPTY_COUNTS: RecipeStateCounts = { all: 0, with: 0, without: 0, pending: 0 };

/** "Recetas": los productos con su receta. */
export const useProductRecipes = () => {
  const [products, setProducts] = useState<ProductRecipe[]>([]);
  const [counts, setCounts] = useState<RecipeStateCounts>(EMPTY_COUNTS);
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ProductRecipesFilters>({
    search: "",
    category_id: null,
    recipe_state: null,
  });

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productRecipesListApi({
        ...filters,
        page: pagination.p_page,
        size: pagination.p_size,
      });
      setProducts(response.data);
      setCounts(response.counts);
      setPagination(response.pagination);
    } catch (error) {
      console.error(error);
      toast({ title: "Error al cargar los productos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.p_page, pagination.p_size]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const resetPage = () => setPagination((prev) => ({ ...prev, p_page: 1 }));

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    resetPage();
  };

  /** Lo que se aplica desde el pop-up: el estado de receta y la categoría. */
  const handleApplyFilters = (applied: ProductRecipesFilters) => {
    setFilters((prev) => ({
      ...prev,
      category_id: applied.category_id ?? null,
      recipe_state: applied.recipe_state ?? null,
    }));
    resetPage();
  };

  const hasActiveFilters =
    Boolean(filters.category_id) || filters.recipe_state != null;

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, p_page: page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPagination((prev) => ({ ...prev, p_size: size, p_page: 1 }));
  };

  return {
    products,
    counts,
    pagination,
    loading,
    filters,
    hasActiveFilters,
    handleSearchChange,
    handleApplyFilters,
    handlePageChange,
    handlePageSizeChange,
    reload: fetchProducts,
  };
};
