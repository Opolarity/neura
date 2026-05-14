import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  MovementRequestListItem,
  MovementRequestFilters,
  MovementRequestSituationOption,
  MovementRequestView,
  mapApiItemToListItem,
} from "../types/MovementRequestList.types";
import { getStockMovementRequestsApi } from "../services/MovementRequests.service";
import { PaginationState } from "@/shared/components/pagination/Pagination";

export const useMovementRequests = () => {
  const [requests, setRequests] = useState<MovementRequestListItem[]>([]);
  const [situations, setSituations] = useState<MovementRequestSituationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [userWarehouseId, setUserWarehouseId] = useState<number | null>(null);
  const [filters, setFilters] = useState<MovementRequestFilters>({
    view: "received",
    situation_id: null,
    page: 1,
    page_size: 20,
  });
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });
  const { toast } = useToast();

  const loadRequests = useCallback(async (filtersObj: MovementRequestFilters) => {
    setLoading(true);
    try {
      const data = await getStockMovementRequestsApi(filtersObj);
      setRequests((data.data ?? []).map(mapApiItemToListItem));
      setPagination({
        p_page: data.page?.p_page ?? 1,
        p_size: data.page?.p_size ?? 20,
        total: data.page?.total ?? 0,
      });
      setUserWarehouseId(data.userWarehouseId ?? null);
      if (data.situations && data.situations.length > 0) {
        setSituations(data.situations);
      }
    } catch (error: any) {
      console.error("Error loading movement requests:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las solicitudes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadRequests(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleViewChange = async (view: MovementRequestView) => {
    const next = { ...filters, view, page: 1 };
    setFilters(next);
    await loadRequests(next);
  };

  const handleSituationChange = async (situation_id: number | null) => {
    const next = { ...filters, situation_id, page: 1 };
    setFilters(next);
    await loadRequests(next);
  };

  const handlePageChange = async (page: number) => {
    const next = { ...filters, page };
    setFilters(next);
    await loadRequests(next);
  };

  const handleSizeChange = async (page_size: number) => {
    const next = { ...filters, page_size, page: 1 };
    setFilters(next);
    await loadRequests(next);
  };

  const hasActiveFilters = filters.situation_id !== null;

  return {
    requests,
    loading,
    userWarehouseId,
    filters,
    pagination,
    situations,
    hasActiveFilters,
    handleViewChange,
    handleSituationChange,
    handlePageChange,
    handleSizeChange,
    reload: () => loadRequests(filters),
  };
};
