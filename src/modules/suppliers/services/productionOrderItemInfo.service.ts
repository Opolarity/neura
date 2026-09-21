import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/query";
import { toProductionOrderItemInfo } from "../adapters/productionOrderItemInfo.adapter";
import {
  ItemInfoPayload,
  ProductionOrderItemInfo,
} from "../types/productionOrderItemInfo.types";

/**
 * Vínculos ítem ↔ paso con su avance, más el consolidado de merma por paso.
 *
 * El SP devuelve también los nombres del proceso y del servicio, y el ranking
 * de dónde se pierde más — que es lo que no se podía armar leyendo la tabla a
 * secas.
 */
export const itemInfoApi = async (
  productionOrderId: number
): Promise<ProductionOrderItemInfo> => {
  const endpoint = buildEndpoint("get-production-order-item-info", {
    production_order_id: productionOrderId,
  });

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;

  return toProductionOrderItemInfo(data?.data ?? {});
};

/**
 * Reemplaza los vínculos de la orden por los que llegan.
 *
 * Va todo junto y no fila a fila porque desmarcar una celda es borrar el
 * vínculo: mandar solo las marcadas dejaría vivas las que se quitaron.
 */
export const updateItemInfoApi = async (
  productionOrderId: number,
  rows: ItemInfoPayload[]
): Promise<void> => {
  const { data, error } = await supabase.functions.invoke(
    "update-production-order-item-info",
    { method: "POST", body: { production_order_id: productionOrderId, rows } }
  );

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
};
