import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/query";
import { toProductionOrderPurchases } from "../adapters/productionOrderPurchases.adapter";
import { ProductionOrderPurchase } from "../types/productionOrderPurchases.types";

/**
 * Las compras de material que cuelgan de una orden, una por proveedor.
 *
 * Solo lectura. El vínculo es `supplier_services.production_order_id`, que es
 * PROCEDENCIA —de qué orden nació la compra— y no un paso de la ruta.
 */
export const productionOrderPurchasesApi = async (
  productionOrderId: number,
): Promise<ProductionOrderPurchase[]> => {
  const endpoint = buildEndpoint("get-production-order-purchases", {
    production_order_id: productionOrderId,
  });

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;

  return toProductionOrderPurchases(data?.purchases);
};
