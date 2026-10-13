import { supabase } from "@/integrations/supabase/client";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";

// "cancelled": el franquiciado volvió a contar y coincidió con lo enviado.
export type QuantityAdjustmentStatus = "pending" | "approved" | "cancelled";

export type QuantityAdjustmentFilter = "all" | QuantityAdjustmentStatus;

// Causa del error que registra el proveedor al confirmar.
export type QuantityAdjustmentCause =
  | "despacho_menos"
  | "despacho_mas"
  | "perdida_transporte"
  | "otro";

export const CAUSE_LABEL: Record<QuantityAdjustmentCause, string> = {
  despacho_menos: "Error de despacho: enviamos menos",
  despacho_mas: "Error de despacho: enviamos más",
  perdida_transporte: "Pérdida en transporte",
  otro: "Otro",
};

// Causas válidas según lo que recibió el franquiciado frente a lo enviado.
export const causesFor = (
  sentQuantity: number,
  receivedQuantity: number,
): QuantityAdjustmentCause[] =>
  receivedQuantity < sentQuantity
    ? ["despacho_menos", "perdida_transporte", "otro"]
    : ["despacho_mas", "otro"];

export type QuantityAdjustmentResult = {
  cause?: QuantityAdjustmentCause;
  note?: string | null;
  delta?: number;
  amount?: number;
  dispatched_by_name?: string | null;
  confirmed_by_name?: string | null;
};

export type QuantityAdjustmentRow = {
  id: number;
  createdAt: string;
  processedAt: string | null;
  daysPending: number;
  status: QuantityAdjustmentStatus;
  franchiseName: string;
  orderId: number;
  sku: string;
  productName: string | null;
  sentQuantity: number;
  receivedQuantity: number;
  phone: string | null;
  resolution: string | null;
  result: QuantityAdjustmentResult | null;
};

type RawAdjustment = {
  id: number;
  status: QuantityAdjustmentStatus;
  created_at: string;
  processed_at: string | null;
  days_pending: number;
  order_id: number;
  franchise_name: string | null;
  sku: string;
  product_name: string | null;
  sent_quantity: number;
  received_quantity: number;
  phone: string | null;
  resolution: string | null;
  result: QuantityAdjustmentResult | null;
};

export type FetchQuantityAdjustmentsParams = {
  status?: QuantityAdjustmentFilter;
  page?: number;
  size?: number;
};

export type FetchQuantityAdjustmentsResult = {
  rows: QuantityAdjustmentRow[];
  total: number;
  pendingCount: number;
};

export const fetchQuantityAdjustments = async ({
  status = "pending",
  page = 1,
  size = 20,
}: FetchQuantityAdjustmentsParams = {}): Promise<FetchQuantityAdjustmentsResult> => {
  // sp_fch_get_quantity_adjustments_list no está en los tipos generados.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc(
    "sp_fch_get_quantity_adjustments_list",
    { p_status: status, p_page: page, p_size: size },
  );

  if (error) throw error;

  return {
    rows: ((data?.rows ?? []) as RawAdjustment[]).map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      processedAt: row.processed_at,
      daysPending: Number(row.days_pending ?? 0),
      status: row.status,
      franchiseName: row.franchise_name ?? "—",
      orderId: row.order_id,
      sku: row.sku,
      productName: row.product_name,
      sentQuantity: Number(row.sent_quantity),
      receivedQuantity: Number(row.received_quantity),
      phone: row.phone,
      resolution: row.resolution,
      result: row.result,
    })),
    total: Number(data?.total ?? 0),
    pendingCount: Number(data?.pending_count ?? 0),
  };
};

// Enlace de WhatsApp con el caso ya escrito, para que el proveedor resuelva la
// diferencia directamente con el franquiciado. Sin teléfono, no hay enlace.
export const buildWhatsAppLink = (row: QuantityAdjustmentRow): string | null => {
  const digits = (row.phone ?? "").replace(/\D/g, "");
  if (digits.length < 9) return null;

  const number = digits.length === 9 ? `51${digits}` : digits;
  const product = row.productName ? `${row.productName} (${row.sku})` : row.sku;
  const text =
    `Hola, te escribimos de Overtake por el pedido ${row.orderId}. ` +
    `De ${product} enviamos ${row.sentQuantity} y registraste ${row.receivedQuantity} recibidas. ` +
    `¿Podemos revisarlo juntos?`;

  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
};

type FranchiseProduct = {
  order_id: number;
  sku: string;
  status: string;
  sent_quantity: number;
  received_quantity: number;
  adjusted_quantity: number | null;
};

const hmacHex = async (message: string, secret: string): Promise<string> => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

// Le avisamos al ERP del franquiciado cómo quedó la diferencia, por el mismo
// canal con el que le enviamos la consignación (VITE_FCH_URL + x-api-key). Es
// best-effort: si no llega, el franquiciado lo recupera con su propia consulta.
// Va por SKU y solo con lo ya confirmado: un SKU con varias líneas sigue
// pendiente para el franquiciado mientras alguna línea no se confirme.
const notifyFranchisee = async (
  pendingRequestId: number,
  products: FranchiseProduct[],
): Promise<void> => {
  const fchUrl = import.meta.env.VITE_FCH_URL as string;
  const secret = import.meta.env.VITE_CONSIGNMENT_API_SECRET as string;
  const approved = products.filter((product) => product.status === "approved");
  if (!fchUrl || !secret || approved.length === 0) return;

  try {
    const apiKey = await hmacHex("ovtk_product_lookup", secret);
    await fetch(
      // Otro proyecto Supabase (VITE_FCH_URL), auth por x-api-key: no pasa por
      // el chokepoint de invokeFunction.
      // eslint-disable-next-line no-restricted-syntax
      `${fchUrl}/functions/v1/ovtk-quantity-adjustment-result`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({
          order_id: approved[0].order_id,
          pending_request_id: pendingRequestId,
          resolved_at: new Date().toISOString(),
          products: approved.map((product) => ({
            sku: product.sku,
            status: product.status,
            sent_quantity: product.sent_quantity,
            received_quantity: product.received_quantity,
            adjusted_quantity: product.adjusted_quantity,
          })),
        }),
      },
    );
  } catch (error) {
    console.error("No se pudo avisar al franquiciado del ajuste:", error);
  }
};

export const confirmQuantityAdjustment = async (
  pendingRequestId: number,
  cause: QuantityAdjustmentCause,
  note: string | null,
): Promise<void> => {
  const response = await invokeFunction("fch-confirm-quantity-adjustment", {
    body: { pending_request_id: pendingRequestId, cause, note },
  });

  await notifyFranchisee(
    pendingRequestId,
    response?.data?.franchise_products ?? [],
  );
};

// ---- Reporte "Errores de despacho" ----

export type DispatchErrorSummary = {
  month: string;
  dispatched_by: string | null;
  dispatched_by_name: string;
  cases: number;
  units: number;
  amount: number;
  lines_dispatched: number | null;
  error_rate: number | null;
};

export type DispatchErrorDetail = {
  id: number;
  order_id: number;
  tenant_reference: string | null;
  sku: string;
  product_name: string | null;
  dispatched_at: string;
  dispatched_by_name: string | null;
  prepared_by_name: string | null;
  confirmed_by_name: string | null;
  cause: QuantityAdjustmentCause;
  note: string | null;
  sent_quantity: number;
  received_quantity: number;
  delta: number;
  amount: number;
};

export type DispatchRecount = {
  id: number;
  order_id: number;
  tenant_reference: string | null;
  sku: string;
  sent_quantity: number;
  reported_quantity: number;
  created_at: string;
};

export type DispatchErrorsReport = {
  summary: DispatchErrorSummary[];
  details: DispatchErrorDetail[];
  recounts: DispatchRecount[];
};

export const fetchDispatchErrors = async (
  startDate: string | null,
  endDate: string | null,
): Promise<DispatchErrorsReport> => {
  // sp_rpt_dispatch_errors no está en los tipos generados. Los parámetros sin
  // valor no se envían: el SP aplica sus defaults.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("sp_rpt_dispatch_errors", {
    p_start_date: startDate ?? undefined,
    p_end_date: endDate ?? undefined,
  });

  if (error) throw error;

  return {
    summary: (data?.summary ?? []) as DispatchErrorSummary[],
    details: (data?.details ?? []) as DispatchErrorDetail[],
    recounts: (data?.recounts ?? []) as DispatchRecount[],
  };
};
