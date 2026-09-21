import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/query";
import { toProductionOrderProcesses } from "../adapters/productionOrderProcesses.adapter";
import {
  ProcessStepPayload,
  ProductionOrderProcesses,
} from "../types/productionOrderProcesses.types";

export const productionOrderProcessesApi = async (
  productionOrderId: number
): Promise<ProductionOrderProcesses> => {
  const endpoint = buildEndpoint("get-production-order-processes", {
    production_order_id: productionOrderId,
  });

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;

  return toProductionOrderProcesses(data?.processes ?? {});
};

/**
 * Guarda todos los pasos de golpe.
 *
 * El SP valida antes de borrar que ningún servicio se quede sin pasos: esas
 * filas son el único vínculo entre la orden y sus servicios.
 */
export const updateProductionOrderProcessesApi = async (
  productionOrderId: number,
  rows: ProcessStepPayload[]
): Promise<void> => {
  const { error } = await supabase.functions.invoke(
    "update-production-order-processes",
    {
      method: "POST",
      body: { production_order_id: productionOrderId, rows },
    }
  );

  if (error) throw error;
};
