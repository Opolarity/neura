import { useCallback, useEffect, useState } from "react";
import type { PaginationState } from "@/shared/components/pagination/Pagination";
import {
  TrainingServiceError,
  type TrainingBooking,
  type TrainingErrorCode,
  type TrainingFilters,
  type TrainingScope,
} from "../types/Training.types";
import { getTrainingBookings } from "../services/Training.service";
import { adaptTrainingBookingsResponse } from "../adapters/trainings.adapter";

const DEFAULT_FILTERS: TrainingFilters = { page: 1, size: 20, scope: "upcoming" };

interface TrainingErrorState {
  message: string;
  code: TrainingErrorCode;
}

export function useTrainings() {
  const [bookings, setBookings] = useState<TrainingBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<TrainingErrorState | null>(null);
  const [filters, setFilters] = useState<TrainingFilters>(DEFAULT_FILTERS);
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: DEFAULT_FILTERS.size,
    total: 0,
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async (currentFilters: TrainingFilters) => {
    setLoading(true);
    try {
      const response = await getTrainingBookings(currentFilters);
      const { bookings: items, pagination: pag } = adaptTrainingBookingsResponse(response);
      setBookings(items);
      setPagination(pag);
      setErrorState(null);
    } catch (error) {
      setBookings([]);
      setPagination((prev) => ({ ...prev, total: 0 }));
      setErrorState(
        error instanceof TrainingServiceError
          ? { message: error.message, code: error.code }
          : {
              message: "No se pudieron cargar las capacitaciones.",
              code: "unknown",
            },
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(filters);
  }, [filters, load]);

  const refresh = useCallback(() => {
    void load(filters);
  }, [filters, load]);

  return {
    bookings,
    loading,
    errorState,
    filters,
    pagination,
    dialogOpen,
    refresh,
    // Cambiar de pestaña vuelve a la primera página: quedarse en la 3 de un
    // listado que ahora tiene una sola es una pantalla vacía sin motivo.
    onScopeChange: (scope: TrainingScope) =>
      setFilters((prev) => ({ ...prev, scope, page: 1 })),
    onPageChange: (page: number) => setFilters((prev) => ({ ...prev, page })),
    onPageSizeChange: (size: number) => setFilters((prev) => ({ ...prev, size, page: 1 })),
    openSchedule: () => setDialogOpen(true),
    onDialogOpenChange: setDialogOpen,
  };
}
