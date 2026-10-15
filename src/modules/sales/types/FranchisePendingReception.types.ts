// Tipos de la pantalla "Pendientes de aceptar" (T-782).
//
// Consignaciones enviadas a franquiciados que todavía tienen líneas sin
// recepcionar (order_products.received_by_franchise IS NULL). Una fila por
// pedido; el detalle de productos se pide aparte al abrir el pedido.

import { PaginationState } from "@/shared/components/pagination/Pagination";

/** pending = nada recibido · partial = algo recibido · accepted = todo recibido. */
export type PendingReceptionStatus = "pending" | "partial" | "accepted";

export interface PendingReceptionFilters {
  page: number;
  size: number;
  /** Filtro principal de la pantalla: por defecto, solo lo pendiente. */
  onlyPending: boolean;
  accountIds: number[];
  search: string | null;
}

export interface PendingReceptionRow {
  orderId: number;
  accountId: number;
  /** Cuenta del franquiciado en este ERP ("GARB CORP SAC"). */
  franchiseName: string;
  tenantReference: string;
  /** Instante del envío (timestamptz); se formatea en hora Lima. */
  sentAt: string;
  /** Días desde el envío, contados en hora Lima por el SP. */
  daysWaiting: number;
  linesTotal: number;
  linesPending: number;
  unitsSent: number;
  unitsPending: number;
  valuePending: number;
  status: PendingReceptionStatus;
}

/** Contador global (sin filtros): lo que queda por atacar. */
export interface PendingReceptionSummary {
  franchiseesPending: number;
  ordersPending: number;
  linesPending: number;
  unitsPending: number;
  valuePending: number;
}

export interface PendingReceptionFranchisee {
  id: number;
  name: string;
  tenantReference: string;
  ordersPending: number;
}

export interface PendingReceptionList {
  data: PendingReceptionRow[];
  summary: PendingReceptionSummary;
  franchisees: PendingReceptionFranchisee[];
  pagination: PaginationState;
}

export interface PendingReceptionItem {
  id: number;
  productName: string;
  sku: string | null;
  quantity: number;
  /** null = el franquiciado aún no recepciona la línea. */
  received: number | null;
  productPrice: number;
  pending: boolean;
}

// ── Respuestas crudas del backend (snake_case) ──────────────────────────────

export interface PendingReceptionRowApi {
  order_id: number;
  account_id: number;
  franchise_name: string | null;
  tenant_reference: string;
  sent_at: string;
  sent_date: string;
  days_waiting: number;
  lines_total: number;
  lines_pending: number;
  units_sent: number | string;
  units_pending: number | string;
  value_pending: number | string;
  status: PendingReceptionStatus;
}

export interface PendingReceptionListApi {
  data: PendingReceptionRowApi[] | null;
  summary: {
    franchisees_pending: number;
    orders_pending: number;
    lines_pending: number | string;
    units_pending: number | string;
    value_pending: number | string;
  } | null;
  franchisees: {
    id: number;
    name: string | null;
    tenant_reference: string;
    orders_pending: number;
  }[] | null;
  pagination: PaginationState | null;
}

export interface PendingReceptionItemsApi {
  order_id: number;
  items: {
    id: number;
    product_name: string | null;
    sku: string | null;
    quantity: number | string;
    received: number | string | null;
    product_price: number | string | null;
    pending: boolean;
  }[] | null;
}
