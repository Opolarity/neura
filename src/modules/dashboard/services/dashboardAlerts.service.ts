import { supabase } from "@/integrations/supabase/client";
import { fetchSalesList } from "@/modules/sales/services/Sales.service";
import { fetchPendingPayments } from "@/modules/sales/services/PendingPayments.service";
import { fetchQuantityAdjustments } from "@/modules/sales/services/PendingQuantityAdjustments.service";

// Cada conteo sale de la misma consulta que usa la pantalla a la que lleva la
// alerta (con una sola fila por página): así el número coincide con lo que el
// usuario ve al llegar, con sus mismos filtros y permisos.

/** Diferencias de cantidad de consignación que esperan confirmación. */
export const countPendingQuantityAdjustments = async (): Promise<number> => {
  const { pendingCount } = await fetchQuantityAdjustments({
    status: "pending",
    page: 1,
    size: 1,
  });
  return pendingCount;
};

/** Pagos de franquiciados que esperan confirmación. */
export const countPendingFranchisePayments = async (): Promise<number> => {
  const { total } = await fetchPendingPayments({ status: "pending", page: 1, size: 1 });
  return total;
};

// Situación "En proceso" de las ventas. Se busca por código y no por id: el id
// depende de la base (local, demo, producción).
const IN_PROGRESS_SITUATION_CODE = "PEP-VIR";

export const fetchInProgressSituationId = async (): Promise<number | null> => {
  const { data, error } = await supabase
    .from("situations")
    .select("id, modules!inner(code)")
    .eq("code", IN_PROGRESS_SITUATION_CODE)
    .eq("modules.code", "ORD")
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
};

/** Ventas cuyo estado actual es la situación indicada. */
export const countSalesBySituation = async (situationId: number): Promise<number> => {
  const response = await fetchSalesList({
    search: null,
    situationId,
    saleType: null,
    startDate: null,
    endDate: null,
    consignament: null,
    paymentStatus: null,
    order: "date_desc",
    page: 1,
    size: 1,
  });
  return Number(response?.page?.total ?? 0);
};
