import { useState, useEffect } from "react";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useToast } from "@/hooks/use-toast";
import {
  fetchPOSSessions,
  POSSessionListItem,
  POSSessionsFilters,
} from "../services/POSSessions.service";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { useNavigate } from "react-router-dom";

export const usePOSSessions = () => {
  const [sessions, setSessions] = useState<POSSessionListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });
  const [filters, setFilters] = useState<POSSessionsFilters>({
    search: null,
    statusId: null,
    page: 1,
    size: 20,
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  const loadData = async (currentFilters: POSSessionsFilters) => {
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
    loadData(filters);
  }, []);

  const onSearchChange = (value: string) => setSearch(value);

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

  return {
    sessions,
    loading,
    search,
    pagination,
    onSearchChange,
    onPageChange,
    handlePageSizeChange,
    goToOpenPOS,
  };
};
