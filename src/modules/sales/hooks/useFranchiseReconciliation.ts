import { useCallback, useEffect, useRef, useState } from "react";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { toastError } from "@/shared/utils/toastError";
import { fetchFranchiseTenants } from "../services/FranchiseStock.service";
import { fetchFranchiseReconciliation } from "../services/FranchiseReconciliation.service";
import { franchiseReconciliationAdapter } from "../adapters/FranchiseReconciliation.adapter";
import { FranchiseCategory, FranchiseeTenant } from "../types/FranchiseStock.types";
import {
  FranchiseReconciliationFilters,
  FranchiseReconciliationRow,
  FranchiseReconciliationTotals,
  ReconciliationStatus,
} from "../types/FranchiseReconciliation.types";

const DEFAULT_FILTERS: FranchiseReconciliationFilters = {
  page: 1,
  size: 20,
  search: null,
  status: null,
  categories: null,
};

export const useFranchiseReconciliation = () => {
  const [franchisees, setFranchisees] = useState<FranchiseeTenant[]>([]);
  const [loadingFranchisees, setLoadingFranchisees] = useState(true);
  const [tenantReference, setTenantReference] = useState<string | null>(null);

  const [rows, setRows] = useState<FranchiseReconciliationRow[]>([]);
  const [totals, setTotals] = useState<FranchiseReconciliationTotals | null>(null);
  const [categories, setCategories] = useState<FranchiseCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });
  const [filters, setFilters] =
    useState<FranchiseReconciliationFilters>(DEFAULT_FILTERS);

  // Descarta respuestas que ya quedaron obsoletas al cambiar de filtro o página.
  const requestId = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const loadFranchisees = async () => {
      setLoadingFranchisees(true);
      try {
        const tenants = await fetchFranchiseTenants();
        if (!cancelled) setFranchisees(tenants);
      } catch (error) {
        console.error("Error cargando franquiciados:", error);
        if (!cancelled) toastError(error, "No se pudo cargar la lista de franquiciados");
      } finally {
        if (!cancelled) setLoadingFranchisees(false);
      }
    };

    loadFranchisees();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!tenantReference) {
      setRows([]);
      setTotals(null);
      setCategories([]);
      setPagination((prev) => ({ ...prev, total: 0 }));
      return;
    }

    const currentRequest = ++requestId.current;
    setLoading(true);

    fetchFranchiseReconciliation(tenantReference, filters)
      .then((response) => {
        if (currentRequest !== requestId.current) return;
        const adapted = franchiseReconciliationAdapter(response);
        setRows(adapted.data);
        setTotals(adapted.totals);
        setCategories(adapted.categories);
        setPagination(adapted.pagination);
      })
      .catch((error) => {
        if (currentRequest !== requestId.current) return;
        console.error("Error cargando la conciliación:", error);
        toastError(error, "No se pudo cargar la conciliación del franquiciado");
        // Sin stock completo no hay comparación válida: no se dejan datos viejos.
        setRows([]);
        setTotals(null);
        setPagination((prev) => ({ ...prev, total: 0 }));
      })
      .finally(() => {
        if (currentRequest === requestId.current) setLoading(false);
      });
  }, [tenantReference, filters]);

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const searchTerm = debouncedSearch || null;
    setFilters((prev) =>
      prev.search === searchTerm ? prev : { ...prev, search: searchTerm, page: 1 },
    );
  }, [debouncedSearch]);

  const onSelectFranchisee = useCallback((value: string) => {
    setTenantReference(value || null);
    setSearch("");
    setFilters(DEFAULT_FILTERS);
    setPagination((prev) => ({ ...prev, p_page: 1 }));
  }, []);

  const onPageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setFilters((prev) => ({ ...prev, size, page: 1 }));
  }, []);

  const onStatusChange = useCallback((value: string) => {
    const status = value === "all" ? null : (value as ReconciliationStatus);
    setFilters((prev) => ({ ...prev, status, page: 1 }));
  }, []);

  const onCategoriesChange = useCallback((ids: number[]) => {
    setFilters((prev) => ({
      ...prev,
      categories: ids.length > 0 ? ids : null,
      page: 1,
    }));
  }, []);

  return {
    franchisees,
    loadingFranchisees,
    tenantReference,
    rows,
    totals,
    categories,
    loading,
    search,
    pagination,
    filters,
    onSelectFranchisee,
    onSearchChange: setSearch,
    onPageChange,
    handlePageSizeChange,
    onStatusChange,
    onCategoriesChange,
  };
};
