import { PaginationState } from "@/shared/components/pagination/Pagination";

/**
 * Lo que se le debe a cada taller.
 *
 * Una fila por SERVICIO, no por cotización: es la unidad en la que el taller
 * trabaja y en la que se cobra. Y solo aparecen los servicios ya recibidos —
 * mientras la mercadería no llega, hay un compromiso, no una deuda, y meterlo
 * en la lista de por pagar haría cuadrar mal el total adeudado.
 */

/** Cómo va de pagado un servicio. Lo decide el backend, no la pantalla. */
export type SupplierPaymentStatus = "PENDING" | "PARTIAL" | "PAID";

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
  /** Lo exigible: el precio vigente del servicio. */
  payable: number;
  /** Lo suyo directo más su parte de los pagos hechos a la cotización entera. */
  paid: number;
  balance: number;
  status: SupplierPaymentStatus;
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
  status?: SupplierPaymentStatus | null;
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
