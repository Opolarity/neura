import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import { buildEndpoint } from "@/shared/utils/query";
import { toMasterPlanLines } from "../adapters/planning.adapter";
import { MasterPlanLinesFilters, MasterPlanLinesResponse } from "../types/planning.types";

type Raw = Record<string, unknown>;

/** Plan de producción por línea (edge get-master-plan-lines → sp_get_master_plan_lines). */
export const masterPlanLinesApi = async (
  filters: MasterPlanLinesFilters & { page: number; size: number }
): Promise<MasterPlanLinesResponse> => {
  const data = await invokeFunction(
    buildEndpoint("get-master-plan-lines", {
      search: filters.search || undefined,
      state: filters.state ?? undefined,
      cut_state: filters.cutState ?? undefined,
      week: filters.week ?? undefined,
      date_from: filters.dateFrom ?? undefined,
      date_to: filters.dateTo ?? undefined,
      page: filters.page,
      size: filters.size,
    }),
    { method: "GET" }
  );
  return toMasterPlanLines((data?.data ?? null) as Raw | null);
};
