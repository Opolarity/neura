import { useState, useEffect, useRef, useCallback } from "react";
import {
  QuotationListItem,
  QuotationsFilters,
  QuotationsPaginationState,
} from "../types/Quotations.types";
import { fetchQuotationsList } from "../services/Quotations.service";
import { quotationListAdapter } from "../adapters/Quotations.adapter";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useToast } from "@/hooks/use-toast";
import { toastError } from "@/shared/utils/toastError";

const DEFAULT_FILTERS: QuotationsFilters = {
  search: null,
  order: "created_at_desc",
  page: 1,
  size: 20,
};

export const useQuotations = () => {
  const [quotations, setQuotations] = useState<QuotationListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<QuotationsFilters>(DEFAULT_FILTERS);
  const [pagination, setPagination] = useState<QuotationsPaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });

  const filtersRef = useRef<QuotationsFilters>(DEFAULT_FILTERS);
  const { toast } = useToast();

  const updateFilters = useCallback((newFilters: QuotationsFilters) => {
    filtersRef.current = newFilters;
    setFilters(newFilters);
  }, []);

  const loadData = useCallback(async (currentFilters: QuotationsFilters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchQuotationsList(currentFilters);
      const adapted = quotationListAdapter(response.data.data);
      setQuotations(adapted);
      setPagination({
        p_page: response.data.page.page,
        p_size: response.data.page.size,
        total: response.data.page.total,
      });
    } catch (err) {
      console.error("Error loading quotations:", err);
      setError("Ocurrió un error al cargar las cotizaciones");
      toastError(err, "No se pudieron cargar las cotizaciones");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData(DEFAULT_FILTERS);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const currentFilters = filtersRef.current;
    if (debouncedSearch !== (currentFilters.search ?? "")) {
      const newFilters: QuotationsFilters = {
        ...currentFilters,
        search: debouncedSearch || null,
        page: 1,
      };
      updateFilters(newFilters);
      loadData(newFilters);
    }
  }, [debouncedSearch, loadData, updateFilters]);

  const onSearchChange = (value: string) => {
    setSearch(value);
  };

  const onPageChange = (page: number) => {
    const newFilters = { ...filtersRef.current, page };
    updateFilters(newFilters);
    loadData(newFilters);
  };

  const handlePageSizeChange = (size: number) => {
    const newFilters = { ...filtersRef.current, size, page: 1 };
    updateFilters(newFilters);
    loadData(newFilters);
  };

  const onOrderChange = (order: string) => {
    const newFilters = { ...filtersRef.current, order, page: 1 };
    updateFilters(newFilters);
    loadData(newFilters);
  };

  return {
    quotations,
    loading,
    error,
    search,
    pagination,
    filters,
    onSearchChange,
    onPageChange,
    handlePageSizeChange,
    onOrderChange,
  };
};
