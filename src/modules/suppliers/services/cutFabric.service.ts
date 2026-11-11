import { supabase } from "@/integrations/supabase/client";
import { toCutFabric, toCutFabricOptions } from "../adapters/cutFabric.adapter";
import { AddCutWasteInput, CutFabric, CutFabricOption } from "../types/cutFabric.types";

/**
 * `rpc` sin los tipos generados: los SPs son nuevos (pase de multicliente,
 * 202610280002) y no están en ellos.
 */
type RpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};
const plano = supabase as unknown as RpcClient;

/** La tela de la OP y, por O/C, lo usado y su consumo real. */
export const cutFabricApi = async (productionOrderId: number): Promise<CutFabric> => {
  const { data, error } = await plano.rpc("sp_get_cut_order_fabric", {
    p_production_order_id: productionOrderId,
  });
  if (error) throw new Error(error.message);
  return toCutFabric(data);
};

/** Las telas del catálogo por nombre o código, con su stock por almacén (202610280004). */
export const searchCutFabricApi = async (search: string): Promise<CutFabricOption[]> => {
  const { data, error } = await plano.rpc("sp_search_cut_fabric_options", {
    p_search: search.trim() || null,
    p_limit: 20,
  });
  if (error) throw new Error(error.message);
  return toCutFabricOptions(data);
};

/** Ingresa merma de una tela de la O/C (202611060010). No descuenta stock. */
export const addCutWasteApi = async (input: AddCutWasteInput): Promise<void> => {
  const { error } = await plano.rpc("sp_add_cut_waste", {
    p_cut_order_id: input.cutOrderId,
    p_material_variation_id: input.materialVariationId,
    p_warehouse_id: input.warehouseId,
    p_quantity: input.quantity,
    p_unit: input.unit,
  });
  if (error) throw new Error(error.message);
};

/** Anula una merma ingresada: sale del inventario Merma, sin borrarse. */
export const voidCutWasteApi = async (id: number): Promise<void> => {
  const { error } = await plano.rpc("sp_void_cut_waste", { p_id: id });
  if (error) throw new Error(error.message);
};

// La tela se guarda con el corte, en la misma transacción: registerCutFullApi (2026-10-30).
