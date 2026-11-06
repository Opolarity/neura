// Tipos de la pantalla "Conciliación de retornos" (S-297).
//
// El stock físico viene del backend de franquiciados; el saldo esperado, de los
// pedidos de consignación de este ERP. Los cruza get-franchise-reconciliation.

export type ReconciliationStatus = "ok" | "shortage" | "surplus" | "review";

export type ReconciliationReviewReason =
  | "no_ledger"
  | "oversold"
  | "received_gap"
  | "inactive_movement";

export interface FranchiseReconciliationRow {
  sku: string;
  productName: string;
  variationName: string;
  sent: number;
  received: number;
  sold: number;
  returned: number;
  inTransit: number;
  expected: number;
  physical: number;
  /** Saldo esperado - stock físico. Positiva = faltante. */
  difference: number;
  minPrice: number | null;
  maxPrice: number | null;
  balanceValue: number;
  status: ReconciliationStatus;
  reviewReasons: ReconciliationReviewReason[];
}

export interface FranchiseReconciliationTotals {
  sent: number;
  received: number;
  sold: number;
  returned: number;
  inTransit: number;
  expected: number;
  physical: number;
  balanceValue: number;
  inactiveUnits: number;
  counts: Record<ReconciliationStatus, number>;
}

export interface FranchiseReconciliationFilters {
  page: number;
  size: number;
  search: string | null;
  status: ReconciliationStatus | null;
  categories: number[] | null;
}

export interface FranchiseReconciliationApiResponse {
  data: Array<{
    sku: string | null;
    product_name: string | null;
    variation_name: string | null;
    sent: number | null;
    received: number | null;
    sold: number | null;
    returned: number | null;
    in_transit: number | null;
    expected: number | null;
    physical: number | null;
    difference: number | null;
    min_price: number | null;
    max_price: number | null;
    balance_value: number | null;
    status: ReconciliationStatus;
    review_reasons: ReconciliationReviewReason[] | null;
  }>;
  page: { page: number; size: number; total: number };
  totals: {
    sent: number;
    received: number;
    sold: number;
    returned: number;
    in_transit: number;
    expected: number;
    physical: number;
    balance_value: number;
    inactive_units: number;
    count_ok: number;
    count_shortage: number;
    count_surplus: number;
    count_review: number;
  };
  categories: Array<{ id: number; name: string | null; parent_id: number | null }>;
}
