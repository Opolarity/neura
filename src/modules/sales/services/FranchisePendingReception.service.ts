import { buildEndpoint } from "@/shared/utils/query";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import {
  PendingReceptionFilters,
  PendingReceptionItemsApi,
  PendingReceptionListApi,
} from "../types/FranchisePendingReception.types";

/**
 * Consignaciones enviadas con líneas sin recepcionar por el franquiciado, una
 * fila por pedido, más el contador global de la pantalla (T-782).
 */
export const fetchPendingReceptions = async (
  filters: PendingReceptionFilters,
): Promise<PendingReceptionListApi> => {
  const endpoint = buildEndpoint("get-franchise-pending-receptions", {
    page: filters.page,
    size: filters.size,
    // Siempre se manda: el backend asume "true" si falta.
    only_pending: String(filters.onlyPending),
    // CSV: buildEndpoint hace String(array), que ya produce "27,31".
    account_ids: filters.accountIds.length ? filters.accountIds.join(",") : null,
    search: filters.search,
  });

  const data = await invokeFunction(endpoint, { method: "GET" });
  return data as PendingReceptionListApi;
};

/** Líneas de un pedido, con las pendientes de aceptar primero. */
export const fetchPendingReceptionItems = async (
  orderId: number,
): Promise<PendingReceptionItemsApi> => {
  const endpoint = buildEndpoint("get-franchise-pending-reception-items", {
    order_id: orderId,
  });

  const data = await invokeFunction(endpoint, { method: "GET" });
  return data as PendingReceptionItemsApi;
};
