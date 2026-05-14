// =============================================
// POS Sessions List Hook
// =============================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { POSSessionListItem, POSSessionUser, POSSessionsListFilters } from "../types/POSList.types";
import { getPOSSessionsList } from "../services/POSList.service";
import { adaptPOSSessionsList } from "../adapters/POSList.adapter";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { useDebounce } from "@/shared/hooks/useDebounce";

export const usePOSList = () => {
  const [sessions, setSessions] = useState<POSSessionListItem[]>([]);
  const [users, setUsers] = useState<POSSessionUser[]>([]);
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
    user_id: null,
    opened_date: null,
    closed_date: null,
    page: 1,
    size: 20,
  });
  const [appliedModalFilters, setAppliedModalFilters] = useState({
    user_id: "",
    opened_date: "",
    closed_date: "",
  });

  const navigate = useNavigate();

  const loadData = async (currentFilters?: POSSessionsListFilters) => {
    setLoading(true);
    setError(null);

    try {
      const filtersToUse = currentFilters || filters;
      const response = await getPOSSessionsList(filtersToUse);
      const { sessions, users, pagination } = adaptPOSSessionsList(response);
      setSessions(sessions);
      setUsers(users);
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

  const resetModalFilters = () => {
    setAppliedModalFilters({ user_id: "", opened_date: "", closed_date: "" });
  };

  const applyModalFilters = (draft: typeof appliedModalFilters) => {
    setAppliedModalFilters(draft);
    const newFilters: POSSessionsListFilters = {
      ...filters,
      user_id: draft.user_id || null,
      opened_date: draft.opened_date || null,
      closed_date: draft.closed_date || null,
      page: 1,
    };
    setFilters(newFilters);
    loadData(newFilters);
  };

  const goToPOS = () => {
    navigate("/pos/open");
  };

  return {
    sessions,
    users,
    loading,
    error,
    search,
    pagination,
    appliedModalFilters,
    onSearchChange,
    onPageChange,
    handlePageSizeChange,
    applyModalFilters,
    resetModalFilters,
    goToPOS,
  };
};
