/**
 * Una compra de material que cuelga de una orden de producción.
 *
 * Es UNA cotización, y por tanto UN proveedor:
 * `supplier_service_quotations` tiene un solo `supplier_id`, así que comprar el
 * mismo requerimiento a dos proveedores son dos compras y dos papeles.
 */
export interface ProductionOrderPurchase {
  quotationId: number;
  quotationCode: string | null;
  quotationDescription: string;
  /** Las notas de la cotización. */
  quotationNotes: string | null;
  /** Moneda pactada (ISO) y condición de pago de la cotización. */
  currency: string | null;
  paymentTerms: string | null;
  supplierId: number;
  supplierName: string;
  /** Cuántas líneas de material lleva. */
  lines: number;
  /** Suma de los precios vigentes. 0 = comprado y aún sin importe. */
  total: number;
  createdAt: string;
}
