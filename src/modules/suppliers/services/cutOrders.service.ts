import { supabase } from "@/integrations/supabase/client";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import { buildEndpoint } from "@/shared/utils/query";
import { toCutFabricRpcItems } from "../adapters/cutFabric.adapter";
import { CutOrders, RegisterCutFullPayload } from "../types/cutOrders.types";

/**
 * `rpc` sin los tipos generados: los SPs del corte (pase de multicliente,
 * 202610280014) son nuevos y no están en ellos.
 */
type RpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};
const plano = supabase as unknown as RpcClient;

const num = (value: unknown): number => Number(value ?? 0);
const numOrNull = (value: unknown): number | null =>
  value === undefined || value === null || value === "" ? null : Number(value);
const textOrNull = (value: unknown): string | null =>
  value === undefined || value === null || value === "" ? null : String(value);

type Raw = Record<string, unknown>;
const list = (value: unknown): Raw[] => (Array.isArray(value) ? (value as Raw[]) : []);

/** Respuesta de sp_get_cut_orders → modelo de UI. */
const toCutOrders = (raw: Raw): CutOrders => ({
  productionOrderId: num(raw?.production_order_id),
  cutPlannedDate: textOrNull(raw?.cut_planned_date),
  attributes: list(raw?.attributes).map((a) => ({
    termId: numOrNull(a.term_id),
    termName: String(a.term_name ?? ""),
    groupName: textOrNull(a.group_name),
    items: list(a.items).map((i) => ({
      productionOrderItemId: num(i.production_order_item_id),
      label: String(i.label ?? ""),
      sizeName: textOrNull(i.size_name),
      ordered: num(i.ordered),
      cut: num(i.cut),
      remaining: num(i.remaining),
      cutDone: num(i.cut_done),
      productId: numOrNull(i.product_id),
      styleCode: textOrNull(i.style_code),
      color: textOrNull(i.color),
    })),
  })),
  cutOrders: list(raw?.cut_orders).map((c) => ({
    id: num(c.id),
    code: String(c.code ?? ""),
    termId: numOrNull(c.term_id),
    termName: textOrNull(c.term_name),
    total: num(c.total),
    cutTotal: numOrNull(c.cut_total),
    orderPercent: numOrNull(c.order_percent),
    cutOn: textOrNull(c.cut_on),
    items: list(c.items).map((i) => ({
      productionOrderItemId: num(i.production_order_item_id),
      label: String(i.label ?? ""),
      sizeName: textOrNull(i.size_name),
      quantity: num(i.quantity),
      ordered: num(i.ordered ?? i.quantity),
      cutQuantity: numOrNull(i.cut_quantity),
    })),
  })),
});

export const cutOrdersApi = async (productionOrderId: number): Promise<CutOrders> => {
  const data = await invokeFunction(
    buildEndpoint("get-cut-orders", { production_order_id: productionOrderId }),
    { method: "GET" }
  );
  return toCutOrders((data?.data ?? {}) as Raw);
};

/** Borra una O/C que aún no tiene nada que dependa de ella. */
export const deleteCutOrderApi = (cutOrderId: number) =>
  invokeFunction("delete-cut-order", { method: "POST", body: { id: cutOrderId } });

/**
 * «Iniciar corte» (2026-10-30): el corte de un estilo + color y su tela en una
 * sola transacción (sp_register_cut_full). Abre una O/C nueva o, con
 * `correct`, corrige lo cortado de una que ya existe.
 */
export const registerCutFullApi = async (
  productionOrderId: number,
  payload: RegisterCutFullPayload
): Promise<{ cutOrderId: number; code: string; saved: number }> => {
  const { data, error } = await plano.rpc("sp_register_cut_full", {
    p_production_order_id: productionOrderId,
    p_cut_order_id: payload.cutOrderId,
    p_code: payload.correct ? null : payload.code?.trim() || null,
    p_cut_on: payload.cutOn,
    p_items: payload.items.map((i) => ({
      production_order_item_id: i.productionOrderItemId,
      cut_quantity: i.cutQuantity,
    })),
    p_fabrics: payload.fabrics === null ? null : toCutFabricRpcItems(payload.fabrics),
    p_correct: payload.correct,
  });
  if (error) throw new Error(error.message);
  const row = (data ?? {}) as Raw;
  return { cutOrderId: num(row.cut_order_id), code: String(row.code ?? ""), saved: num(row.saved) };
};

/** El siguiente OCT-, para proponerlo (no lo reserva). */
export const nextCutOrderCodeApi = async (): Promise<string> => {
  const { data, error } = await plano.rpc("sp_next_cut_order_code", {});
  if (error) throw new Error(error.message);
  return String(((data ?? {}) as Raw).code ?? "");
};

/**
 * La fecha programada (pactada) del Corte de la OP (202610280015): va al
 * servicio de su paso Corte, que es de donde la lee el Plan. null la borra.
 */
export const setCutPlannedDateApi = async (productionOrderId: number, date: string | null): Promise<void> => {
  const { error } = await plano.rpc("sp_set_cut_planned_date", {
    p_production_order_id: productionOrderId,
    p_date: date,
  });
  if (error) throw new Error(error.message);
};
