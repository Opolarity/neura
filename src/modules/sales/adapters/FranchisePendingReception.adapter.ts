// snake_case (API) -> camelCase (pantalla "Pendientes de aceptar", T-782)

import {
  PendingReceptionItem,
  PendingReceptionItemsApi,
  PendingReceptionList,
  PendingReceptionListApi,
} from "../types/FranchisePendingReception.types";

// Los SUM de Postgres llegan como numeric y PostgREST puede serializarlos como
// string: se normalizan aquí para que la UI solo vea números.
const toNumber = (value: number | string | null | undefined): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const pendingReceptionListAdapter = (
  response: PendingReceptionListApi,
): PendingReceptionList => ({
  data: (response.data ?? []).map((row) => ({
    orderId: row.order_id,
    accountId: row.account_id,
    franchiseName: row.franchise_name ?? "-",
    tenantReference: row.tenant_reference,
    sentAt: row.sent_at,
    daysWaiting: toNumber(row.days_waiting),
    linesTotal: toNumber(row.lines_total),
    linesPending: toNumber(row.lines_pending),
    unitsSent: toNumber(row.units_sent),
    unitsPending: toNumber(row.units_pending),
    valuePending: toNumber(row.value_pending),
    status: row.status,
  })),
  summary: {
    franchiseesPending: toNumber(response.summary?.franchisees_pending),
    ordersPending: toNumber(response.summary?.orders_pending),
    linesPending: toNumber(response.summary?.lines_pending),
    unitsPending: toNumber(response.summary?.units_pending),
    valuePending: toNumber(response.summary?.value_pending),
  },
  franchisees: (response.franchisees ?? []).map((f) => ({
    id: f.id,
    name: f.name ?? f.tenant_reference,
    tenantReference: f.tenant_reference,
    ordersPending: toNumber(f.orders_pending),
  })),
  pagination: response.pagination ?? { p_page: 1, p_size: 20, total: 0 },
});

export const pendingReceptionItemsAdapter = (
  response: PendingReceptionItemsApi,
): PendingReceptionItem[] =>
  (response.items ?? []).map((item) => ({
    id: item.id,
    productName: item.product_name ?? "-",
    sku: item.sku,
    quantity: toNumber(item.quantity),
    received: item.received === null ? null : toNumber(item.received),
    productPrice: toNumber(item.product_price),
    pending: item.pending,
  }));
