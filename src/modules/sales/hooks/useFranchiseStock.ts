import { useCallback, useEffect, useRef, useState } from "react";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { toastError } from "@/shared/utils/toastError";
import { getFranchiseeAccounts } from "@/modules/discounts/services/PriceRule.services";
import { FranchiseeAccount } from "@/modules/discounts/types/priceRule.types";
import { fetchFranchiseStock } from "../services/FranchiseStock.service";
import { franchiseStockAdapter } from "../adapters/FranchiseStock.adapter";
import {
  FranchiseCategory,
  FranchiseStockFilters,
  FranchiseStockRow,
  FranchiseWarehouse,
} from "../types/FranchiseStock.types";

const DEFAULT_FILTERS: FranchiseStockFilters = {
  page: 1,
  size: 20,
  search: null,
  order: null,
  minstock: null,
  maxstock: null,
  categories: null,
};

export const useFranchiseStock = () => {
  const [franchisees, setFranchisees] = useState<FranchiseeAccount[]>([]);
  const [loadingFranchisees, setLoadingFranchisees] = useState(true);
  const [tenantReference, setTenantReference] = useState<string | null>(null);

  const [rows, setRows] = useState<FranchiseStockRow[]>([]);
  const [warehouses, setWarehouses] = useState<FranchiseWarehouse[]>([]);
  // Arbol de categorias del franquiciado. Llega en la misma respuesta del stock
  // (el SP lo calcula sobre el universo del tenant, sin aplicar los filtros),
  // asi que no hay llamada extra ni la lista cambia al filtrar.
  const [categories, setCategories] = useState<FranchiseCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });
  const [isOpenFilterModal, setIsOpenFilterModal] = useState(false);
  const [filters, setFilters] = useState<FranchiseStockFilters>(DEFAULT_FILTERS);

  // Descarta respuestas de peticiones que ya quedaron obsoletas: al teclear en
  // el buscador o pasar de página rápido, una respuesta lenta anterior puede
  // llegar después de la nueva y pisar la tabla con datos viejos.
  const requestId = useRef(0);

  // ── Selector de franquiciados ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const loadFranchisees = async () => {
      setLoadingFranchisees(true);
      try {
        const accounts = await getFranchiseeAccounts();
        if (!cancelled) setFranchisees(accounts);
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

  // ── Stock ─────────────────────────────────────────────────────────────────
  // Sin franquiciado elegido no hay nada que pedir: la pantalla arranca vacía.
  useEffect(() => {
    if (!tenantReference) {
      setRows([]);
      setWarehouses([]);
      setCategories([]);
      setPagination((prev) => ({ ...prev, total: 0 }));
      return;
    }

    const currentRequest = ++requestId.current;
    setLoading(true);

    fetchFranchiseStock(tenantReference, filters)
      .then((response) => {
        if (currentRequest !== requestId.current) return;
        const {
          data,
          warehouses: whs,
          categories: cats,
          pagination: newPagination,
        } = franchiseStockAdapter(response);
        setRows(data);
        setWarehouses(whs);
        setCategories(cats);
        setPagination(newPagination);
      })
      .catch((error) => {
        if (currentRequest !== requestId.current) return;
        console.error("Error cargando el stock del franquiciado:", error);
        toastError(error, "No se pudo cargar el stock del franquiciado");
        setRows([]);
      })
      .finally(() => {
        if (currentRequest === requestId.current) setLoading(false);
      });
  }, [tenantReference, filters]);

  // ── Búsqueda con debounce ─────────────────────────────────────────────────
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const searchTerm = debouncedSearch || null;
    setFilters((prev) =>
      prev.search === searchTerm ? prev : { ...prev, search: searchTerm, page: 1 },
    );
  }, [debouncedSearch]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const onSelectFranchisee = useCallback((value: string) => {
    setTenantReference(value || null);
    setSearch("");
    setFilters(DEFAULT_FILTERS);
    setPagination((prev) => ({ ...prev, p_page: 1 }));
  }, []);

  const onSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const onPageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setFilters((prev) => ({ ...prev, size, page: 1 }));
  }, []);

  const onOrderChange = useCallback((order: string) => {
    const orderValue = order === "none" ? null : order;
    setFilters((prev) => ({ ...prev, order: orderValue, page: 1 }));
  }, []);

  const onOpenFilterModal = useCallback(() => setIsOpenFilterModal(true), []);
  const onCloseFilterModal = useCallback(() => setIsOpenFilterModal(false), []);

  const onApplyFilter = useCallback(
    (newFilters: FranchiseStockFilters) => {
      if (newFilters.search === null && search !== "") setSearch("");
      setFilters((prev) => ({ ...newFilters, page: 1, size: prev.size }));
      setIsOpenFilterModal(false);
    },
    [search],
  );

  const hasActiveFilters =
    filters.minstock !== null ||
    filters.maxstock !== null ||
    !!filters.categories?.length;

  const selectedFranchisee =
    franchisees.find((f) => f.tenant_reference === tenantReference) ?? null;

  return {
    franchisees,
    loadingFranchisees,
    tenantReference,
    selectedFranchisee,
    rows,
    warehouses,
    categories,
    loading,
    search,
    pagination,
    isOpenFilterModal,
    filters,
    hasActiveFilters,
    onSelectFranchisee,
    onSearchChange,
    onPageChange,
    handlePageSizeChange,
    onOrderChange,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
  };
};
