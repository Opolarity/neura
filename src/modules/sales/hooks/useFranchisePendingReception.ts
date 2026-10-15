import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { toastError } from "@/shared/utils/toastError";
import {
  fetchPendingReceptionItems,
  fetchPendingReceptions,
} from "../services/FranchisePendingReception.service";
import { fetchFranchiseTenants } from "../services/FranchiseStock.service";
import {
  pendingReceptionItemsAdapter,
  pendingReceptionListAdapter,
} from "../adapters/FranchisePendingReception.adapter";
import type {
  PendingReceptionFilters,
  PendingReceptionFranchisee,
  PendingReceptionItem,
  PendingReceptionRow,
  PendingReceptionSummary,
} from "../types/FranchisePendingReception.types";
import type { FranchiseeTenant } from "../types/FranchiseStock.types";
import type { FranchiseeMultiSelectOption } from "../components/FranchiseeMultiSelect";

const DEFAULT_FILTERS: PendingReceptionFilters = {
  page: 1,
  size: 20,
  onlyPending: true,
  accountIds: [],
  search: null,
};

const EMPTY_SUMMARY: PendingReceptionSummary = {
  franchiseesPending: 0,
  ordersPending: 0,
  linesPending: 0,
  unitsPending: 0,
  valuePending: 0,
};

export const useFranchisePendingReception = () => {
  const [rows, setRows] = useState<PendingReceptionRow[]>([]);
  const [summary, setSummary] = useState<PendingReceptionSummary>(EMPTY_SUMMARY);
  const [franchisees, setFranchisees] = useState<PendingReceptionFranchisee[]>([]);
  const [tenants, setTenants] = useState<FranchiseeTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });
  const [filters, setFilters] = useState<PendingReceptionFilters>(DEFAULT_FILTERS);
  const [search, setSearch] = useState("");

  const [selectedRow, setSelectedRow] = useState<PendingReceptionRow | null>(null);
  const [items, setItems] = useState<PendingReceptionItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Descarta respuestas obsoletas: al teclear o paginar rápido, una respuesta
  // lenta anterior puede llegar después de la nueva y pisar la tabla.
  const requestId = useRef(0);
  const itemsRequestId = useRef(0);

  // ── Nombre comercial de cada franquiciado ─────────────────────────────────
  // La cuenta local guarda la razón social ("GARB CORP SAC"); al franquiciado
  // se le conoce por su tienda ("Bultiger Club"), que vive en el otro backend.
  // Si el puente falla, la pantalla sigue con la razón social.
  useEffect(() => {
    let cancelled = false;
    fetchFranchiseTenants()
      .then((list) => {
        if (!cancelled) setTenants(list);
      })
      .catch((error) => {
        console.error("Error cargando los nombres de los franquiciados:", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Listado ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const currentRequest = ++requestId.current;
    setLoading(true);

    fetchPendingReceptions(filters)
      .then((response) => {
        if (currentRequest !== requestId.current) return;
        const adapted = pendingReceptionListAdapter(response);
        setRows(adapted.data);
        setSummary(adapted.summary);
        setFranchisees(adapted.franchisees);
        setPagination(adapted.pagination);
      })
      .catch((error) => {
        if (currentRequest !== requestId.current) return;
        console.error("Error cargando pendientes de aceptar:", error);
        toastError(error, "No se pudieron cargar los pedidos pendientes de aceptar");
        setRows([]);
      })
      .finally(() => {
        if (currentRequest === requestId.current) setLoading(false);
      });
  }, [filters]);

  // ── Búsqueda con debounce ─────────────────────────────────────────────────
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const searchTerm = debouncedSearch.trim() || null;
    setFilters((prev) =>
      prev.search === searchTerm ? prev : { ...prev, search: searchTerm, page: 1 },
    );
  }, [debouncedSearch]);

  // ── Detalle de un pedido ──────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedRow) {
      setItems([]);
      return;
    }

    const currentRequest = ++itemsRequestId.current;
    setLoadingItems(true);

    fetchPendingReceptionItems(selectedRow.orderId)
      .then((response) => {
        if (currentRequest !== itemsRequestId.current) return;
        setItems(pendingReceptionItemsAdapter(response));
      })
      .catch((error) => {
        if (currentRequest !== itemsRequestId.current) return;
        console.error("Error cargando los productos del pedido:", error);
        toastError(error, "No se pudieron cargar los productos del pedido");
        setItems([]);
      })
      .finally(() => {
        if (currentRequest === itemsRequestId.current) setLoadingItems(false);
      });
  }, [selectedRow]);

  // ── Derivados ─────────────────────────────────────────────────────────────
  const storeNameByAccountId = useMemo(() => {
    const map = new Map<number, string>();
    tenants.forEach((tenant) => {
      const name = tenant.name?.trim();
      if (tenant.account_id != null && name) map.set(tenant.account_id, name);
    });
    return map;
  }, [tenants]);

  const getStoreName = useCallback(
    (accountId: number, fallback: string) =>
      storeNameByAccountId.get(accountId) ?? fallback,
    [storeNameByAccountId],
  );

  const franchiseeOptions = useMemo<FranchiseeMultiSelectOption[]>(
    () =>
      franchisees.map((franchisee) => {
        const storeName = storeNameByAccountId.get(franchisee.id);
        const tenant = tenants.find((t) => t.account_id === franchisee.id);
        return {
          id: franchisee.id,
          storeName: storeName || franchisee.name,
          // Sin tienda, la razón social ya hace de etiqueta: no se repite.
          accountName: storeName ? franchisee.name : null,
          provinceName: tenant?.province_name ?? null,
        };
      }),
    [franchisees, storeNameByAccountId, tenants],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const onOnlyPendingChange = useCallback((onlyPending: boolean) => {
    setFilters((prev) => ({ ...prev, onlyPending, page: 1 }));
  }, []);

  const onAccountIdsChange = useCallback((accountIds: number[]) => {
    setFilters((prev) => ({ ...prev, accountIds, page: 1 }));
  }, []);

  const onPageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const onPageSizeChange = useCallback((size: number) => {
    setFilters((prev) => ({ ...prev, size, page: 1 }));
  }, []);

  return {
    rows,
    summary,
    franchiseeOptions,
    getStoreName,
    loading,
    pagination,
    filters,
    search,
    onSearchChange: setSearch,
    onOnlyPendingChange,
    onAccountIdsChange,
    onPageChange,
    onPageSizeChange,
    selectedRow,
    onOpenOrder: setSelectedRow,
    onCloseOrder: () => setSelectedRow(null),
    items,
    loadingItems,
  };
};
