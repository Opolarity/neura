import { useCallback, useEffect, useState } from "react";
import type { PaginationState } from "@/shared/components/pagination/Pagination";
import {
  SupportServiceError,
  type SupportErrorCode,
  type SupportRequestListItem,
  type SupportRequestType,
  type SupportRequestsFacets,
  type SupportRequestsFilters,
} from "../types/Support.types";
import { getSupportRequests } from "../services/SupportRequests.service";
import { adaptSupportRequestsResponse } from "../adapters/supportRequests.adapter";

const DEFAULT_FILTERS: SupportRequestsFilters = {
  page: 1,
  size: 20,
  requestType: null,
  reporterName: null,
  status: null,
  originHost: null,
};

const EMPTY_FACETS: SupportRequestsFacets = {
  reporters: [],
  statuses: [],
  origins: [],
};

/** Hay algún filtro activo (la paginación no cuenta). */
export const hasActiveSupportFilters = (filters: SupportRequestsFilters): boolean =>
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
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: DEFAULT_FILTERS.size,
    total: 0,
  });
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const onPageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const onPageSizeChange = (size: number) => {
    setFilters((prev) => ({ ...prev, size, page: 1 }));
  };

  const onRequestTypeChange = (requestType: SupportRequestType | null) => {
    setFilters((prev) => ({ ...prev, requestType, page: 1 }));
  };

  const onReporterNameChange = (reporterName: string | null) => {
    setFilters((prev) => ({ ...prev, reporterName, page: 1 }));
  };

  const onStatusChange = (status: string | null) => {
    setFilters((prev) => ({ ...prev, status, page: 1 }));
  };

  const onOriginHostChange = (originHost: string | null) => {
    setFilters((prev) => ({ ...prev, originHost, page: 1 }));
  };

  // Se conserva el tamaño de página elegido: solo se limpian los filtros
  const clearFilters = () => {
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
    hasActiveFilters: hasActiveSupportFilters(filters),
    pagination,
    dialogOpen,
    onPageChange,
    onPageSizeChange,
    onRequestTypeChange,
    onReporterNameChange,
    onStatusChange,
    onOriginHostChange,
    clearFilters,
    refresh,
    openNewRequest,
    onDialogOpenChange,
  };
}
