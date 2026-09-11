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

export const resolveQuantityAdjustment = async (
  pendingRequestId: number,
  action: "confirm" | "reject",
): Promise<void> => {
  await invokeFunction("fch-confirm-quantity-adjustment", {
    body: { pending_request_id: pendingRequestId, action },
  });
};
