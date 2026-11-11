import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import { buildEndpoint } from "@/shared/utils/query";

/**
 * Costo de producir una OP (sp_get_production_order_cost, de multicliente
 * 202610150003): materiales + encargos a talleres.
 */
export interface ProductionOrderCost {
  /** El costo estimado del requerimiento de materiales. */
  materials: number;
  /** Los encargos a proveedores, a su precio vigente. */
  services: number;
  total: number;
  garments: number;
  /** Total entre las prendas; null sin prendas. */
  unitCost: number | null;
}

type Raw = Record<string, unknown>;
const num = (value: unknown): number => Number(value ?? 0);

const toCost = (raw: Raw): ProductionOrderCost => ({
  materials: num(raw?.materials),
  services: num(raw?.services),
  total: num(raw?.total),
  garments: num(raw?.garments),
  unitCost: raw?.unit_cost === null || raw?.unit_cost === undefined ? null : Number(raw.unit_cost),
});

export const productionOrderCostApi = async (productionOrderId: number): Promise<ProductionOrderCost> => {
  const data = await invokeFunction(
    buildEndpoint("get-production-order-cost", { production_order_id: productionOrderId }),
    { method: "GET" }
  );
  return toCost((data?.data ?? {}) as Raw);
};
