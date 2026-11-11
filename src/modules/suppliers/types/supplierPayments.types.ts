import { PaginationState } from "@/shared/components/pagination/Pagination";

/**
 * Lo que se le debe a cada taller.
 *
 * Una fila por SERVICIO (o por taller × OP en Pagos y cobros). Qué se debe lo
 * decide el backend con la regla de personalizado (fn_supplier_service_payable:
 * el precio vigente desde «En proceso»); lo pagado sale de los pagos
 * registrados. La pantalla no recalcula nada.
 */

/** Cómo va de pagado un servicio. Lo decide el backend, no la pantalla. */
export type SupplierPaymentStatus = "PENDING" | "PARTIAL" | "PAID";

/** Filtro de la lista: lo no pagado del todo, lo pagado, o todo. */
export type SupplierPayablesStatusFilter = "OPEN" | "PAID" | null;

export interface SupplierPaymentsApiResponse {
  paymentsdata: {
    data: Array<{
      service_id: number;
      service_code: string | null;
      service_description: string | null;
      supplier_quotation_id: number;
      quotation_code: string | null;
      quotation_description: string | null;
      supplier_id: number | null;
      supplier_name: string | null;
      payable: number | string | null;
      paid: number | string | null;
      balance: number | string | null;
      status: SupplierPaymentStatus;
      production_orders?: string | null;
      requested_quantity?: number | string | null;
      good_quantity?: number | string | null;
      bad_quantity?: number | string | null;
      situation_name?: string | null;
      received_on?: string | null;
      is_material?: boolean | null;
    }>;
    page: { page: number; size: number; total: number };
    /** Sobre TODO lo filtrado, no sobre la página: "cuánto debo" no puede
        depender de en qué página se esté mirando. */
    totals: { payable: number | string; paid: number | string; balance: number | string };
  };
}

export interface SupplierPaymentRow {
  serviceId: number;
  serviceCode: string;
  serviceDescription: string;
  quotationId: number;
  quotationCode: string;
  quotationDescription: string;
  supplierId: number | null;
  supplierName: string;
  /** Lo exigible: el precio vigente del servicio (regla del backend). */
  payable: number;
  /** Lo suyo directo más su parte de los pagos hechos a la cotización entera. */
  paid: number;
  balance: number;
  status: SupplierPaymentStatus;
  /** OP-0006, … de las que sale el servicio. */
  productionOrders?: string | null;
  /** Lo pedido, lo que volvió bueno y lo que volvió fallado. */
  requestedQuantity?: number | null;
  goodQuantity?: number | null;
  badQuantity?: number | null;
  situationName?: string | null;
  /** Cuándo se recibió (día civil de Lima). */
  receivedOn?: string | null;
  /** Una compra de material, no un servicio de taller. */
  isMaterial?: boolean;
}

/** Lo que se le debe a un taller en una OP: la suma de sus servicios exigibles. */
export interface SupplierPayableRow {
  supplierId: number | null;
  supplierName: string;
  services: number;
  pendingServices: number;
  /** En cuántas OP trabajó (202610150002). */
  productionOrders: number;
  /** La OP de la fila (202610190008); null = servicios sin OP. */
  productionOrderId: number | null;
  productionOrderCode: string | null;
  productionOrderName: string | null;
  payable: number;
  paid: number;
  balance: number;
  /** La recepción más antigua que sigue sin pagarse del todo. */
  oldestPendingOn: string | null;
  status: SupplierPaymentStatus;
}

export interface SupplierPayablesApiResponse {
  payablesdata: {
    data: Array<{
      supplier_id: number | null;
      supplier_name: string | null;
      services: number | string;
      pending_services: number | string;
      production_orders?: number | string;
      production_order_id?: number | null;
      production_order_code?: string | null;
      production_order_name?: string | null;
      payable: number | string | null;
      paid: number | string | null;
      balance: number | string | null;
      oldest_pending_on: string | null;
      status: SupplierPaymentStatus;
    }>;
    page: { page: number; size: number; total: number };
    totals: { payable: number | string; paid: number | string; balance: number | string };
  };
}

export interface SupplierPayablesFilters {
  page?: number;
  size?: number;
  search?: string | null;
  status?: SupplierPayablesStatusFilter;
}

export interface SupplierPayablesResult {
  data: SupplierPayableRow[];
  pagination: PaginationState;
  totals: SupplierPaymentsTotals;
}

export interface SupplierPaymentsTotals {
  payable: number;
  paid: number;
  balance: number;
}

export interface SupplierPaymentsFilters {
  page?: number;
  size?: number;
  search?: string | null;
  supplier_id?: number | null;
  /** OPEN = lo no pagado del todo (pendiente o parcial). */
  status?: SupplierPaymentStatus | "OPEN" | null;
  /** Un solo servicio: como pregunta el detalle de un proceso del Plan Maestro. */
  service_id?: number | null;
}

export interface SupplierPaymentsResult {
  data: SupplierPaymentRow[];
  pagination: PaginationState;
  totals: SupplierPaymentsTotals;
}

/**
 * Lo que se manda al registrar un pago.
 *
 * `supplierServiceId` nulo significa "a la cotización entera", y entonces el
 * backend lo reparte entre sus servicios exigibles a prorrata.
 */
export interface AddSupplierPaymentPayload {
  supplierQuotationId: number;
  supplierServiceId: number | null;
  amount: number;
  paymentMethodId: number;
  businessAccountId: number;
  date?: string | null;
  description?: string | null;
  voucherUrl?: string | null;
}

/**
 * Un lote de pagos.
 *
 * El método y la cuenta son UNOS para todo el lote: es un solo desembolso
 * repartido entre varios trabajos. El importe es de cada servicio.
 */
export interface AddSupplierPaymentsBulkPayload {
  payments: Array<{
    supplierQuotationId: number;
    supplierServiceId: number | null;
    amount: number;
  }>;
  paymentMethodId: number;
  businessAccountId: number;
  date?: string | null;
  description?: string | null;
  /**
   * El comprobante del desembolso, ya subido.
   *
   * Uno para todo el lote y repetido en cada pago: el papel es del
   * movimiento de dinero --una transferencia por varios servicios-- y cada
   * fila necesita poder enseñarlo por su cuenta.
   */
  voucherUrl?: string | null;
}
