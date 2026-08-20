import { supabase } from "@/integrations/supabase/client";
import { throwFunctionError } from "@/shared/utils/functionError";

export type PendingPaymentStatus = "pending" | "approved";

export type PendingPaymentFilter = "all" | PendingPaymentStatus;

export type PendingPaymentRow = {
  id: number;
  createdAt: string;
  processedAt: string | null;
  status: PendingPaymentStatus;
  franchiseName: string;
  totalAmount: number;
  files: string[];
  movementCode: string;
  businessAccountId: number;
  paymentMethodId: number;
  orderProducts: Array<{
    company_order_id: number;
    sku: string;
    amount: number;
  }>;
};

type RawPendingRequest = {
  id: number;
  created_at: string;
  processed_at: string | null;
  status: PendingPaymentStatus;
  payload: {
    franchise_name: string;
    total_amount: number;
    files: string[];
    movement_code: string;
    business_account_id: number;
    payment_method_id: number;
    order_products: Array<{
      company_order_id: number;
      sku: string;
      amount: number;
    }>;
  };
};

export type FetchPendingPaymentsParams = {
  status?: PendingPaymentFilter;
  page?: number;
  size?: number;
};

export type FetchPendingPaymentsResult = {
  rows: PendingPaymentRow[];
  total: number;
};

export const fetchPendingPayments = async ({
  status = "pending",
  page = 1,
  size = 20,
}: FetchPendingPaymentsParams = {}): Promise<FetchPendingPaymentsResult> => {
  const from = (page - 1) * size;
  const to = from + size - 1;

  let query = (supabase as any)
    .from("pending_requests")
    .select("id, created_at, processed_at, status, payload", {
      count: "exact",
    })
    .eq("from_fn", "fch-update-order-payments");

  query =
    status === "all"
      ? query.in("status", ["pending", "approved"])
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
      franchiseName: row.payload.franchise_name,
      totalAmount: row.payload.total_amount,
      files: row.payload.files ?? [],
      movementCode: row.payload.movement_code,
      businessAccountId: row.payload.business_account_id,
      paymentMethodId: row.payload.payment_method_id,
      orderProducts: row.payload.order_products ?? [],
    })),
    total: count ?? 0,
  };
};

export const confirmPendingPayment = async (
  pendingRequestId: number,
): Promise<void> => {
  const { data, error } = await supabase.functions.invoke(
    "fch-confirm-payment",
    {
      body: { pending_request_id: pendingRequestId },
    },
  );

  if (error) await throwFunctionError(error);
  if (data && !data.success) {
    throw new Error(data.error ?? "Error al confirmar el pago");
  }
};
