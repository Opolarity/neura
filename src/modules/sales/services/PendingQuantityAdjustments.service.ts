import { supabase } from "@/integrations/supabase/client";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";

export type QuantityAdjustmentStatus = "pending" | "approved" | "rejected";

export type QuantityAdjustmentFilter = "all" | QuantityAdjustmentStatus;

export type QuantityAdjustmentRow = {
  id: number;
  createdAt: string;
  processedAt: string | null;
  status: QuantityAdjustmentStatus;
  franchiseName: string;
  orderId: number;
  sku: string;
  sentQuantity: number;
  receivedQuantity: number;
};

type RawPendingRequest = {
  id: number;
  created_at: string;
  processed_at: string | null;
  status: QuantityAdjustmentStatus;
  payload: {
    order_id: number;
    tenant_reference: string | null;
    sku: string;
    sent_quantity: number;
    received_quantity: number;
  };
};

// Discriminador de las solicitudes que encola fch-confirm-received-products.
const ADJUSTMENT_FROM_FN = "fch-request-quantity-adjustment";

export type FetchQuantityAdjustmentsParams = {
  status?: QuantityAdjustmentFilter;
  page?: number;
  size?: number;
};

export type FetchQuantityAdjustmentsResult = {
  rows: QuantityAdjustmentRow[];
  total: number;
};

export const fetchQuantityAdjustments = async ({
  status = "pending",
  page = 1,
  size = 20,
}: FetchQuantityAdjustmentsParams = {}): Promise<FetchQuantityAdjustmentsResult> => {
  const from = (page - 1) * size;
  const to = from + size - 1;

  // pending_requests no esta en los tipos generados de la BD.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("pending_requests")
    .select("id, created_at, processed_at, status, payload", {
      count: "exact",
    })
    .eq("from_fn", ADJUSTMENT_FROM_FN);

  query =
    status === "all"
      ? query.in("status", ["pending", "approved", "rejected"])
      : query.eq("status", status);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    rows: ((data ?? []) as RawPendingRequest[]).map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      processedAt: row.processed_at,
      status: row.status,
      franchiseName: row.payload.tenant_reference ?? "—",
      orderId: row.payload.order_id,
      sku: row.payload.sku,
      sentQuantity: row.payload.sent_quantity,
      receivedQuantity: row.payload.received_quantity,
    })),
    total: count ?? 0,
  };
};

type ResolvedItem = {
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
const notifyFranchisee = async (
  pendingRequestId: number,
  items: ResolvedItem[],
): Promise<void> => {
  const fchUrl = import.meta.env.VITE_FCH_URL as string;
  const secret = import.meta.env.VITE_CONSIGNMENT_API_SECRET as string;
  if (!fchUrl || !secret || items.length === 0) return;

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
          order_id: items[0].order_id,
          pending_request_id: pendingRequestId,
          resolved_at: new Date().toISOString(),
          products: items.map((item) => ({
            sku: item.sku,
            status: item.status,
            sent_quantity: item.sent_quantity,
            received_quantity: item.received_quantity,
            adjusted_quantity: item.adjusted_quantity,
          })),
        }),
      },
    );
  } catch (error) {
    console.error("No se pudo avisar al franquiciado del ajuste:", error);
  }
};

export const resolveQuantityAdjustment = async (
  pendingRequestId: number,
  action: "confirm" | "reject",
): Promise<void> => {
  const response = await invokeFunction("fch-confirm-quantity-adjustment", {
    body: { pending_request_id: pendingRequestId, action },
  });

  await notifyFranchisee(pendingRequestId, response?.data?.items ?? []);
};
