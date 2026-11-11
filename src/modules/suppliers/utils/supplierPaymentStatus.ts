import { SupplierPaymentStatus } from "../types/supplierPayments.types";

/**
 * Cómo se pinta el estado de pago en Pagos y cobros (2026-10-15): tres
 * estados, para ver de un vistazo a quién no se le pagó nada.
 */
export const ESTADO_PAGO: Record<
  SupplierPaymentStatus,
  { label: string; variant: "destructive-soft" | "warning" | "success" }
> = {
  PENDING: { label: "Por pagar", variant: "destructive-soft" },
  PARTIAL: { label: "Parcial", variant: "warning" },
  PAID: { label: "Pagado", variant: "success" },
};
