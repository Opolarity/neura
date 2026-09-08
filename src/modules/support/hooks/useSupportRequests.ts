import { useCallback, useEffect, useState } from "react";
import type { PaginationState } from "@/shared/components/pagination/Pagination";
import { useDebounce } from "@/shared/hooks/useDebounce";
import {
  SupportServiceError,
  type SupportErrorCode,
  type SupportModalFilters,
  type SupportRequestListItem,
  type SupportRequestsFacets,
  type SupportRequestsFilters,
} from "../types/Support.types";
import { getSupportRequests } from "../services/SupportRequests.service";
import { adaptSupportRequestsResponse } from "../adapters/supportRequests.adapter";

const DEFAULT_FILTERS: SupportRequestsFilters = {
  page: 1,
  size: 20,
  search: "",
  requestType: null,
  reporterName: null,
  status: null,
  originHost: null,
};

/**
 * Escribir dispara una llamada que cruza dos saltos (edge function del ERP →
 * API de OPOLARITY), así que el debounce no es cosmético.
 */
const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_FACETS: SupportRequestsFacets = {
  reporters: [],
  statuses: [],
  origins: [],
};

/** Hay algún filtro activo (la paginación no cuenta). */
export const hasActiveSupportFilters = (filters: SupportRequestsFilters): boolean =>
  filters.search.trim() !== "" ||
  filters.requestType !== null ||
  filters.reporterName !== null ||
  filters.status !== null ||
  filters.originHost !== null;

interface SupportErrorState {
  message: string;
  code: SupportErrorCode;
}

export function useSupportRequests() {
  const [requests, setRequests] = useState<SupportRequestListItem[]>([]);
  const [facets, setFacets] = useState<SupportRequestsFacets>(EMPTY_FACETS);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<SupportErrorState | null>(null);
  const [filters, setFilters] = useState<SupportRequestsFilters>(DEFAULT_FILTERS);
  // El input responde a cada tecla; lo que viaja a la API es el valor ya
  // debounceado, que es el que vive en `filters`.
  const [searchInput, setSearchInput] = useState(DEFAULT_FILTERS.search);
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: DEFAULT_FILTERS.size,
    total: 0,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isOpenFilterModal, setIsOpenFilterModal] = useState(false);

  const load = useCallback(async (currentFilters: SupportRequestsFilters) => {
    setLoading(true);
    try {
      const response = await getSupportRequests(currentFilters);
      const {
        requests: items,
        pagination: pag,
        facets: opts,
      } = adaptSupportRequestsResponse(response);
      setRequests(items);
      setPagination(pag);
      // Los facets vienen del total de solicitudes (no de la página ni del
      // filtro activo), así que las opciones no se recortan al filtrar.
      setFacets(opts);
      setErrorState(null);
    } catch (error) {
      console.error("Error loading support requests:", error);
      const err = error as SupportServiceError;
      setRequests([]);
      setPagination({ p_page: 1, p_size: currentFilters.size, total: 0 });
      // Sin toast: el error se muestra dentro de la vista y es reintentable
      setErrorState({
        message: err?.message || "No se pudieron cargar las solicitudes",
        code: err?.code ?? "unknown",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filters);
  }, [filters, load]);

  // Vuelca el término ya debounceado a los filtros y vuelve a la página 1: la
  // página 3 de un listado sin filtrar no tiene sentido en el filtrado. La
  // guarda de igualdad devuelve el mismo objeto cuando el valor no cambió, y
  // así el efecto de arriba no dispara una carga de más (en el montaje, o al
  // escribir y borrar hasta dejarlo como estaba).
  useEffect(() => {
    setFilters((prev) =>
      prev.search === debouncedSearch
        ? prev
        : { ...prev, search: debouncedSearch, page: 1 },
    );
  }, [debouncedSearch]);

  const onPageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const onPageSizeChange = (size: number) => {
    setFilters((prev) => ({ ...prev, size, page: 1 }));
  };

  const onOpenFilterModal = () => setIsOpenFilterModal(true);

  const onCloseFilterModal = () => setIsOpenFilterModal(false);

  // Los cuatro filtros se aplican de una sola vez, al confirmar el modal, y no
  // select a select: así una consulta cubre todo el cambio en vez de una por
  // campo tocado. Se vuelve a la página 1 — la página 3 del listado sin filtrar
  // no tiene equivalente en el filtrado.
  const onApplyFilter = (next: SupportModalFilters) => {
    setFilters((prev) => ({ ...prev, ...next, page: 1 }));
    setIsOpenFilterModal(false);
  };

  // Se conserva el tamaño de página elegido: solo se limpian los filtros
  const clearFilters = () => {
    // El input también, o el término seguiría escrito sin estar aplicado
    setSearchInput("");
    setFilters((prev) => ({ ...DEFAULT_FILTERS, size: prev.size }));
  };

  const refresh = () => load(filters);

  const openNewRequest = () => setDialogOpen(true);

  // El SupportDialog no expone onCreated: se cierra solo tras un envío exitoso
  // (y al cancelar). Refrescamos al cerrarse — un refetch de más al cancelar es
  // más barato que refactorizar el dialog.
  const onDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) load(filters);
  };

  return {
    requests,
    facets,
    loading,
    errorState,
    filters,
    // El valor sin debounce: es lo que se pinta en el input
    search: searchInput,
    hasActiveFilters: hasActiveSupportFilters(filters),
    pagination,
    dialogOpen,
    isOpenFilterModal,
    onSearchChange: setSearchInput,
    onPageChange,
    onPageSizeChange,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
    clearFilters,
    refresh,
    openNewRequest,
    onDialogOpenChange,
  };
}
