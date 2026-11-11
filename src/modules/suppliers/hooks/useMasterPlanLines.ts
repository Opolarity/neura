import { useCallback, useEffect, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { masterPlanLinesApi } from "../services/planning.service";
import { MasterPlanLinesFilters, MasterPlanLinesResponse } from "../types/planning.types";

const EMPTY: MasterPlanLinesResponse = {
  data: [],
  pagination: { p_page: 1, p_size: 20, total: 0 },
  processes: [],
  sizes: [],
  totals: { quantity: 0, sizes: [] },
};

/** Por defecto, lo que no terminó: lo que se mira cada día. */
export const DEFAULT_MASTER_PLAN_FILTERS: MasterPlanLinesFilters = {
  search: "",
  state: "OPEN",
  cutState: null,
  week: null,
  dateFrom: null,
  dateTo: null,
};

/** Las líneas del Plan de producción, paginadas, con sus filtros. */
export const useMasterPlanLines = () => {
  const [response, setResponse] = useState<MasterPlanLinesResponse>(EMPTY);
  const [pagination, setPagination] = useState<PaginationState>({ p_page: 1, p_size: 20, total: 0 });
  const [filters, setFiltersState] = useState<MasterPlanLinesFilters>(DEFAULT_MASTER_PLAN_FILTERS);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await masterPlanLinesApi({ ...filters, page: pagination.p_page, size: pagination.p_size });
      setResponse(data);
      setPagination(data.pagination);
    } catch (error) {
      toast({ title: "Error al cargar el plan de producción: " + (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.p_page, pagination.p_size]);

  useEffect(() => {
    load();
  }, [load]);

  /** Todo lo filtrado, sin paginar: para el Excel. */
  const fetchAll = async (): Promise<MasterPlanLinesResponse | null> => {
    try {
      setExporting(true);
      return await masterPlanLinesApi({ ...filters, page: 1, size: 5000 });
    } catch (error) {
      toast({ title: "No se pudo exportar: " + (error as Error).message, variant: "destructive" });
      return null;
    } finally {
      setExporting(false);
    }
  };

  return {
    ...response,
    pagination,
    filters,
    loading,
    exporting,
    fetchAll,
    setFilters: (next: MasterPlanLinesFilters) => {
      setFiltersState(next);
      setPagination((prev) => ({ ...prev, p_page: 1 }));
    },
    setPage: (page: number) => setPagination((prev) => ({ ...prev, p_page: page })),
    setPageSize: (size: number) => setPagination((prev) => ({ ...prev, p_size: size, p_page: 1 })),
  };
};
