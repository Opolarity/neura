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

/**
 * Trae a la orden la receta vigente de sus prendas
 * (sp_refresh_production_order_recipe): cada una pasa a la receta de su
 * producto si ya la tiene y se rehace su foto con consumos y costos de hoy.
 */
export const refreshProductionOrderRecipeApi = async (
  productionOrderId: number
): Promise<{ itemsRecipeChanged: number; itemsRefreshed: number }> => {
  const { data, error } = await supabase.functions.invoke(
    "refresh-production-order-recipe",
    { method: "POST", body: { production_order_id: productionOrderId } }
  );

  if (error) throw error;

  return {
    itemsRecipeChanged: Number(data?.data?.items_recipe_changed ?? 0),
    itemsRefreshed: Number(data?.data?.items_refreshed ?? 0),
  };
};
