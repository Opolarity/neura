import { FunctionError } from "@/shared/utils/functionError";

// =============================================
// Cupón de la venta (crear venta y POS)
// El código lo valida process-price-rules; create-order registra su uso y lo
// vuelve a validar justo antes de crear la venta.
// =============================================

/** Mensaje cuando el motor no devolvió motivo pero tampoco aplicó el cupón. */
export const COUPON_NOT_APPLIED_MESSAGE = "El cupón no aplica a esta venta";

/** Mensaje cuando no se pudo consultar al motor de reglas. */
export const COUPON_VALIDATION_FAILED_MESSAGE =
  "No se pudo validar el cupón. Intenta aplicarlo nuevamente.";

/** Mensaje si se intenta guardar mientras el motor aún valida el cupón. */
export const COUPON_PENDING_MESSAGE =
  "Espera a que se valide el cupón antes de guardar la venta.";

/** Los códigos se guardan en mayúsculas y sin espacios en los extremos. */
export const normalizeCouponCode = (code: string): string | null =>
  code.trim().toUpperCase() || null;

/**
 * Motivo del rechazo de un cupón aplicado, o null si el motor lo confirmó. Un
 * cupón solo queda aplicado si el motor devolvió su id (cambió el carrito) sin
 * motivo de rechazo y la consulta no falló.
 */
export const couponRejectionReason = (result: {
  couponDiscountId: number | null;
  couponError: string | null;
  failed: boolean;
}): string | null => {
  if (result.failed) return COUPON_VALIDATION_FAILED_MESSAGE;
  if (result.couponError) return result.couponError;
  if (!result.couponDiscountId) return COUPON_NOT_APPLIED_MESSAGE;
  return null;
};

/**
 * Si create-order rechazó la venta por el cupón (409 con code COUPON_*), devuelve
 * el motivo para mostrarlo; si el error es otro, null.
 */
export const couponErrorFromSave = (error: unknown): string | null => {
  if (!(error instanceof FunctionError) || !error.code?.startsWith("COUPON_")) return null;
  const body = error.body as { couponError?: unknown } | undefined;
  const reason =
    typeof body?.couponError === "string" && body.couponError.trim()
      ? body.couponError.trim()
      : error.message;
  return reason || COUPON_NOT_APPLIED_MESSAGE;
};

/** Texto del toast cuando el cupón se retira al guardar. */
export const couponRemovedOnSaveMessage = (reason: string): string =>
  `${reason.replace(/[.\s]+$/, "")}. Se quitó el descuento del cupón y se recalculó el total; revisa la venta y vuelve a guardarla.`;
