import { supabase } from "@/integrations/supabase/client";

export type PendingPaymentRow = {
  id: number;
  createdAt: string;
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

export const fetchPendingPayments = async (): Promise<PendingPaymentRow[]> => {
  const { data, error } = await (supabase as any)
    .from("pending_requests")
    .select("id, created_at, payload")
    .eq("from_fn", "fch-update-order-payments")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as RawPendingRequest[]).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    franchiseName: row.payload.franchise_name,
    totalAmount: row.payload.total_amount,
    files: row.payload.files ?? [],
    movementCode: row.payload.movement_code,
    businessAccountId: row.payload.business_account_id,
    paymentMethodId: row.payload.payment_method_id,
    orderProducts: row.payload.order_products ?? [],
  }));
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

  if (error) throw error;
  if (data && !data.success) {
    throw new Error(data.error ?? "Error al confirmar el pago");
  }
};
