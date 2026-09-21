import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/query";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import {
  toProductionPlanProcessColumns,
  toProductionPlanRoutes,
  toProductionPlanRow,
} from "../adapters/productionPlan.adapter";
import {
  ProductionPlanFilters,
  ProductionPlanProcessColumn,
  ProductionPlanRoutes,
  ProductionPlanRow,
} from "../types/productionPlan.types";

export interface ProductionPlanListResponse {
  data: ProductionPlanRow[];
  /** Las rutas de las órdenes de la página, por id. Viajan con el plan. */
  routes: ProductionPlanRoutes;
  /** Las columnas de proceso de la tabla, de izquierda a derecha. */
  processes: ProductionPlanProcessColumn[];
  pagination: PaginationState;
}

/**
 * El plan y, con él, la ruta de cada orden de la página.
 *
 * La ruta baja aquí y no se pide por orden: se pinta en la fila, y una
 * petición por orden serían hasta 20 por página.
 */
export const productionPlanApi = async (
  filters: ProductionPlanFilters,
): Promise<ProductionPlanListResponse> => {
  const {
    page = 1,
    size = 20,
    search,
    status,
    category_id,
    production_order_class_id,
    production_order_id,
    production_order_status,
    promised_from,
    promised_to,
  } = filters;

  const endpoint = buildEndpoint("get-production-plan", {
    page,
    size,
    search,
    status,
    category_id,
    production_order_class_id,
    production_order_id,
    production_order_status,
    promised_from,
    promised_to,
  });

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;

  const raw = data?.plandata ?? { data: [], page: { page, size, total: 0 } };

  return {
    data: (raw.data ?? []).map(toProductionPlanRow),
    routes: toProductionPlanRoutes(raw.routes),
    processes: toProductionPlanProcessColumns(raw.processes),
    pagination: {
      p_page: raw.page?.page ?? page,
      p_size: raw.page?.size ?? size,
      total: raw.page?.total ?? 0,
    },
  };
};
