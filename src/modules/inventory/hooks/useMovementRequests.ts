import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  MovementRequestListItem,
  MovementRequestSituationOption,
  MovementRequestView,
} from "../types/MovementRequestList.types";
import { getStockMovementRequestsApi } from "../services/MovementRequests.service";

export const useMovementRequests = () => {
  const [requests, setRequests] = useState<MovementRequestListItem[]>([]);
  const [situations, setSituations] = useState<MovementRequestSituationOption[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [userWarehouseId, setUserWarehouseId] = useState<number | null>(null);
  const [view, setView] = useState<MovementRequestView>("received");
  const [situationId, setSituationId] = useState<number | null>(null);
  const { toast } = useToast();

  const loadRequests = useCallback(
    async (
      nextView: MovementRequestView = view,
      nextSituationId: number | null = situationId
    ) => {
      setLoading(true);
      try {
        const data = await getStockMovementRequestsApi({
          view: nextView,
          situation_id: nextSituationId,
        });

        setRequests(data.requests ?? []);
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
    },
    [view, situationId, toast]
  );

  useEffect(() => {
    loadRequests(view, situationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, situationId]);

  const hasActiveFilters = situationId !== null;

  return {
    requests,
    loading,
    userWarehouseId,
    view,
    setView,
    situationId,
    setSituationId,
    situations,
    hasActiveFilters,
    reload: () => loadRequests(view, situationId),
  };
};
