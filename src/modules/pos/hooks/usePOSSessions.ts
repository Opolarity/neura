import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useToast } from "@/hooks/use-toast";
import {
  fetchPOSSessions,
  POSSessionListItem,
  POSSessionsFilters,
} from "../services/POSSessions.service";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { useNavigate } from "react-router-dom";

const defaultFilters: POSSessionsFilters = {
  search: null,
  statusId: null,
  page: 1,
  size: 20,
  dateFrom: null,
  dateTo: null,
  differenceType: null,
  salesMin: null,
  salesMax: null,
  orderBy: "date-desc",
};

export const usePOSSessions = () => {
  const [sessions, setSessions] = useState<POSSessionListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<POSSessionsFilters>(defaultFilters);
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter panel state
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [differenceType, setDifferenceType] = useState<string>("");
  const [salesMin, setSalesMin] = useState<string>("");
  const [salesMax, setSalesMax] = useState<string>("");

  const navigate = useNavigate();
  const { toast } = useToast();

  const loadData = useCallback(async (currentFilters: POSSessionsFilters) => {
    setLoading(true);
    try {
      const response = await fetchPOSSessions(currentFilters);
      setSessions(response.sessions);
      setPagination({
        p_page: currentFilters.page,
        p_size: currentFilters.size,
        total: response.total,
      });
    } catch (err) {
      console.error("Error loading POS sessions:", err);
      toast({
        title: "Error",
        description: "No se pudieron cargar las sesiones de caja",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const newFilters = { ...filters, search: debouncedSearch || null, page: 1 };
    setFilters(newFilters);
    loadData(newFilters);
  }, [debouncedSearch]);

  useEffect(() => {
    loadData(filters);
  }, []);

  const onSearchChange = (value: string) => setSearch(value);

  const onOrderChange = (value: string) => {
    const orderBy = value === "none" ? "date-desc" : value;
    const newFilters = { ...filters, orderBy, page: 1 };
    setFilters(newFilters);
    loadData(newFilters);
  };

  const onApplyFilters = () => {
    const newFilters: POSSessionsFilters = {
      ...filters,
      page: 1,
      dateFrom: dateFrom || null,
      dateTo: dateTo ? dateTo + "T23:59:59Z" : null,
      differenceType: differenceType || null,
      salesMin: salesMin ? parseFloat(salesMin) : null,
      salesMax: salesMax ? parseFloat(salesMax) : null,
    };
    setFilters(newFilters);
    loadData(newFilters);
  };

  const onClearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setDifferenceType("");
    setSalesMin("");
    setSalesMax("");
    const newFilters: POSSessionsFilters = {
      ...filters,
      page: 1,
      dateFrom: null,
      dateTo: null,
      differenceType: null,
      salesMin: null,
      salesMax: null,
    };
    setFilters(newFilters);
    loadData(newFilters);
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

  const goToOpenPOS = () => navigate("/pos/open");

  const activeFilterCount = [
    dateFrom,
    dateTo,
    differenceType,
    salesMin,
    salesMax,
  ].filter(Boolean).length;

  return {
    sessions,
    loading,
    search,
    filters,
    pagination,
    filtersOpen,
    setFiltersOpen,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    differenceType,
    setDifferenceType,
    salesMin,
    setSalesMin,
    salesMax,
    setSalesMax,
    activeFilterCount,
    onSearchChange,
    onOrderChange,
    onApplyFilters,
    onClearFilters,
    onPageChange,
    handlePageSizeChange,
    goToOpenPOS,
  };
};
