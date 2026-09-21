import { useState, useEffect, useCallback } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { Explosion, ExplosionsFilters } from "../types/explosions.types";
import { explosionsListApi } from "../services/explosions.service";

export const useExplosions = () => {
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ExplosionsFilters>({
    search: "",
    variation_id: null,
    product_id: null,
    category_id: null,
    without_variation: null,
    page: 1,
    size: 20,
  });

  const fetchExplosions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await explosionsListApi({
        ...filters,
        page: pagination.p_page,
        size: pagination.p_size,
      });
      setExplosions(response.data);
      setPagination(response.pagination);
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error al cargar explosiones", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.p_page, pagination.p_size]);

  useEffect(() => {
    fetchExplosions();
  }, [fetchExplosions]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setFilters((prev) => ({ ...prev, search: value }));
    setPagination((prev) => ({ ...prev, p_page: 1 }));
  };

  /** Aplica los filtros del modal (tipo de explosión). */
  const handleApplyFilters = (applied: ExplosionsFilters) => {
    setFilters((prev) => ({
      ...prev,
    }));
    setPagination((prev) => ({ ...prev, p_page: 1 }));
  };

  // without_variation admite false ("solo con prenda"), que es un filtro tan
  // activo como true: por eso se compara contra null y no con un truthy.
  const hasActiveFilters =
    Boolean(filters.variation_id) ||
    Boolean(filters.product_id) ||
    Boolean(filters.category_id) ||
    (filters.without_variation ?? null) !== null;

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, p_page: page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPagination((prev) => ({ ...prev, p_size: size, p_page: 1 }));
  };

  return {
    explosions,
    pagination,
    loading,
    search,
    filters,
    hasActiveFilters,
    handleSearchChange,
    handleApplyFilters,
    handlePageChange,
    handlePageSizeChange,
    reload: fetchExplosions,
  };
};
