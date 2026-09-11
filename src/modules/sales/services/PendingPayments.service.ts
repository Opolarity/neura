import { supabase } from "@/integrations/supabase/client";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";

export type PendingPaymentStatus = "pending" | "approved";

export type PendingPaymentFilter = "all" | PendingPaymentStatus;

export type PendingPaymentRow = {
  id: number;
  createdAt: string;
  processedAt: string | null;
  status: PendingPaymentStatus;
  franchiseName: string;
  totalAmount: number;
  // Parte del pago cubierta con el crédito de franquicia (método DEB sobre la
  // cuenta CRE del franquiciado). 0 cuando todo llega en efectivo.
  creditAmount: number;
  // totalAmount − creditAmount: lo que efectivamente entró en dinero.
  cashAmount: number;
  creditPaymentMethodId: number | null;
  creditBusinessAccountId: number | null;
  // Puede venir vacío cuando el pago se cubrió íntegramente con crédito: no
  // hubo dinero, así que no hay comprobante que exigir.
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

/** true cuando el pago no movió dinero: todo se cubrió con crédito. */
export const isFullyCoveredByCredit = (payment: PendingPaymentRow): boolean =>
  payment.creditAmount > 0 && payment.creditAmount >= payment.totalAmount;

type RawPendingRequest = {
  id: number;
  created_at: string;
  processed_at: string | null;
  status: PendingPaymentStatus;
  payload: {
    franchise_name: string;
    total_amount: number;
    credit_amount?: number | string | null;
    cash_amount?: number | string | null;
    credit_payment_method_id?: number | null;
    credit_business_account_id?: number | null;
    files: string[] | null;
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

const toNumber = (value: number | string | null | undefined): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
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
    rows: ((data ?? []) as RawPendingRequest[]).map((row) => {
      const totalAmount = toNumber(row.payload.total_amount);
      const creditAmount = Math.max(0, toNumber(row.payload.credit_amount));
      return {
        id: row.id,
        createdAt: row.created_at,
        processedAt: row.processed_at,
        status: row.status,
        franchiseName: row.payload.franchise_name,
        totalAmount,
        creditAmount,
        // Si el payload trae cash_amount se respeta; si no, se deriva.
        cashAmount:
          row.payload.cash_amount !== undefined && row.payload.cash_amount !== null
            ? toNumber(row.payload.cash_amount)
            : Math.max(0, totalAmount - creditAmount),
        creditPaymentMethodId: row.payload.credit_payment_method_id ?? null,
        creditBusinessAccountId: row.payload.credit_business_account_id ?? null,
        files: row.payload.files ?? [],
        movementCode: row.payload.movement_code,
        businessAccountId: row.payload.business_account_id,
        paymentMethodId: row.payload.payment_method_id,
        orderProducts: row.payload.order_products ?? [],
      };
    }),
    total: count ?? 0,
  };
};

export const confirmPendingPayment = async (
  pendingRequestId: number,
): Promise<void> => {
  await invokeFunction(
    "fch-confirm-payment",
    {
      body: { pending_request_id: pendingRequestId },
    },
  );
};
