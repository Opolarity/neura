import { buildEndpoint } from "@/shared/utils/query";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import {
  FranchiseeTenant,
  FranchiseStockApiResponse,
  FranchiseStockFilters,
} from "../types/FranchiseStock.types";

/**
 * Franquiciados activos para el selector de la pantalla.
 *
 * Va contra get-franchise-tenants, el otro puente de este backend hacia
 * franquiciados. Da el nombre comercial del tenant, que es por el que se
 * conoce al franquiciado; get-franchisee-accounts da la cuenta, que es lo que
 * necesitan las promociones de consignación.
 */
export const fetchFranchiseTenants = async (): Promise<FranchiseeTenant[]> => {
  const data = await invokeFunction("get-franchise-tenants", { method: "GET" });
  return (data?.data ?? []) as FranchiseeTenant[];
};

/**
 * Stock físico de la mercadería Overtake en los almacenes de un franquiciado.
 *
 * Va contra get-franchise-stock, una edge function de ESTE backend que hace de
 * puente hacia el de franquiciados: ella guarda el secreto de consignación y
 * firma la llamada. Por eso esto es un invokeFunction normal y no un fetch con
 * `eslint-disable` como handleSendToFranchisee — el secreto no llega al
 * navegador y la ruta pasa por el chokepoint del proyecto.
 */
export const fetchFranchiseStock = async (
  tenantReference: string,
  filters: FranchiseStockFilters,
): Promise<FranchiseStockApiResponse> => {
  const endpoint = buildEndpoint("get-franchise-stock", {
    tenant_reference: tenantReference,
    page: filters.page,
    size: filters.size,
    search: filters.search,
    order: filters.order,
    minstock: filters.minstock,
    maxstock: filters.maxstock,
    // CSV: buildEndpoint hace String(array), que ya produce "27,31".
    categories: filters.categories?.length ? filters.categories.join(",") : null,
  });

  const data = await invokeFunction(endpoint, { method: "GET" });
  return data as FranchiseStockApiResponse;
};
