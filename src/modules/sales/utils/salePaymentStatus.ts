// =============================================
// Estado de pago calculado de una venta
// =============================================
// Reemplaza a las situaciones "Pendiente de pago" (PEP-VIR) y "Pagado"
// (PAI-VIR): son derivables del historial de pagos, no estados propios del
// ciclo del pedido.

export type SalePaymentStatus = "paid" | "pending";

export const SALE_PAYMENT_STATUS_LABEL: Record<SalePaymentStatus, string> = {
  paid: "Pagado",
  pending: "Pendiente de pago",
};

// Versión corta para espacios reducidos, como la columna del listado.
export const SALE_PAYMENT_STATUS_SHORT_LABEL: Record<SalePaymentStatus, string> = {
  paid: "Pagado",
  pending: "Pendiente",
};

// Forma mínima de un pago para calcular el estado. La cumplen tanto
// SalePayment (formulario) como las filas crudas de order_payment (listado).
export interface PaymentLike {
  amount: string | number | null | undefined;
  completed?: boolean | null;
}

// Los vueltos se guardan en order_payment con importe negativo, igual que en
// fetchOrderPaidAmount: solo cuentan los importes positivos.
const toPositiveAmount = (amount: PaymentLike["amount"]): number | null => {
  const value = typeof amount === "number" ? amount : parseFloat(amount ?? "");
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
};

/**
 * Una venta está pagada si tiene al menos un pago con importe positivo, todos
 * esos pagos están confirmados (`completed === true`) y su suma cubre el total.
 * Cualquier otro caso es "pendiente de pago", sin excepciones por situación
 * (canceladas, reembolsadas y borradores usan la misma regla).
 *
 * Se usa en el formulario, donde hay pagos línea a línea. El listado solo recibe
 * agregados y usa `getSalePaymentStatusFromAmounts`.
 */
export const getSalePaymentStatus = (
  payments: PaymentLike[],
  total: number,
): SalePaymentStatus => {
  const realPayments = payments.filter((p) => toPositiveAmount(p.amount) !== null);

  if (realPayments.length === 0) return "pending";
  if (realPayments.some((p) => p.completed !== true)) return "pending";

  const totalPaid = realPayments.reduce(
    (sum, p) => sum + (toPositiveAmount(p.amount) ?? 0),
    0,
  );

  // Comparación en céntimos para evitar el error de coma flotante.
  return Math.round(totalPaid * 100) >= Math.round((total || 0) * 100)
    ? "paid"
    : "pending";
};

/**
 * Misma regla, pero a partir de los agregados que devuelve `sp_get_sales_list`:
 * `total` (total real de la venta) y `total_paid` (suma de los pagos con
 * `completed = true` e importe positivo).
 *
 * Diferencia con `getSalePaymentStatus`: aquí los pagos sin confirmar no llegan,
 * así que una orden cuyos pagos confirmados ya cubren el total queda "paid"
 * aunque además tenga un pago pendiente.
 */
export const getSalePaymentStatusFromAmounts = (
  totalPaid: number,
  total: number,
): SalePaymentStatus => {
  const paid = Number(totalPaid) || 0;
  if (paid <= 0) return "pending";

  return Math.round(paid * 100) >= Math.round((Number(total) || 0) * 100)
    ? "paid"
    : "pending";
};
