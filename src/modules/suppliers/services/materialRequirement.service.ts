import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/query";
import { toMaterialRequirement } from "../adapters/materialRequirement.adapter";
import { MaterialRequirement } from "../types/materialRequirement.types";

/**
 * Solo lectura. El descuento de stock lo hace el backend al guardar los ítems
 * (fn_replace_production_order_items); esto únicamente muestra la misma cuenta.
 */
export const materialRequirementApi = async (
  productionOrderId: number
): Promise<MaterialRequirement> => {
  const endpoint = buildEndpoint("get-production-order-material-requirement", {
    production_order_id: productionOrderId,
  });

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;

  return toMaterialRequirement(data?.requirement ?? {});
};
