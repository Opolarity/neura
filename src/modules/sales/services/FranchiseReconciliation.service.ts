import { buildEndpoint } from "@/shared/utils/query";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import {
  FranchiseReconciliationApiResponse,
  FranchiseReconciliationFilters,
} from "../types/FranchiseReconciliation.types";

/**
 * Saldo esperado contra stock físico de un franquiciado (S-297). Cada llamada
 * vuelve a leer el stock completo en franquiciados: la edge function nunca
 * responde con stock parcial.
 */
export const fetchFranchiseReconciliation = async (
  tenantReference: string,
  filters: FranchiseReconciliationFilters,
): Promise<FranchiseReconciliationApiResponse> => {
  const endpoint = buildEndpoint("get-franchise-reconciliation", {
    tenant_reference: tenantReference,
    page: filters.page,
    size: filters.size,
    search: filters.search,
    status: filters.status,
    // CSV: buildEndpoint hace String(array), que ya produce "27,31".
    categories: filters.categories?.length ? filters.categories.join(",") : null,
  });

  const data = await invokeFunction(endpoint, { method: "GET" });
  return data as FranchiseReconciliationApiResponse;
};
