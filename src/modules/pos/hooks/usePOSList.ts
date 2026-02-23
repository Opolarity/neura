// =============================================
// POS Sessions List Hook
// =============================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { POSSessionListItem, POSSessionsListFilters } from "../types/POSList.types";
import { getPOSSessionsList } from "../services/POSList.service";
import { adaptPOSSessionsList } from "../adapters/POSList.adapter";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { useDebounce } from "@/shared/hooks/useDebounce";

export const usePOSList = () => {
  const [sessions, setSessions] = useState<POSSessionListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });
  const [filters, setFilters] = useState<POSSessionsListFilters>({
    search: null,
    status_id: null,
    page: 1,
    size: 20,
  });

  const navigate = useNavigate();

  const loadData = async (currentFilters?: POSSessionsListFilters) => {
    setLoading(true);
    setError(null);

    try {
      const filtersToUse = currentFilters || filters;
      const response = await getPOSSessionsList(filtersToUse);
      const { sessions, pagination } = adaptPOSSessionsList(response);
      setSessions(sessions);
      setPagination(pagination);
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al cargar las sesiones POS");
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      const newFilters = { ...filters, search: debouncedSearch || null, page: 1 };
      setFilters(newFilters);
      loadData(newFilters);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadData();
  }, []);

  const onSearchChange = (value: string) => {
    setSearch(value);
  };

  const onPageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    loadData(newFilters);
  };

  const handlePageSizeChange = (size: number) => {
    const newFilters = { ...filters, size, page: 1 };
    setFilters(newFilters);
    loadData(newFilters);
  };

  const goToPOS = () => {
    navigate("/pos");
  };

  return {
    sessions,
    loading,
    error,
    search,
    pagination,
    onSearchChange,
    onPageChange,
    handlePageSizeChange,
    goToPOS,
  };
};
