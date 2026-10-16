// =============================================
// Regla de envío del motor de precios (process-price-rules → shippingRule).
// Misma aritmética que el chatbot (_shared/chbot-price-rules.ts), para que el
// ERP cobre el mismo envío que cotiza y cobra el bot.
// =============================================

export interface ShippingRule {
  // "=" precio fijo (0 = envío gratis), "-" descuenta soles, "-%" descuenta
  // porcentaje del costo del método, "+" suma soles.
  operator: "+" | "-" | "-%" | "=";
  value: number;
  reason: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Costo de envío con la regla aplicada. Siempre gana el menor entre el costo
 * del método y el resultado de la regla: el cliente nunca paga por el envío más
 * que el costo del método que eligió (incluso con "+", igual que el chatbot).
 */
export function applyShippingRule(baseCost: number, rule: ShippingRule | null): number {
  const base = round2(baseCost);
  if (!rule) return base;

  let ruled: number;
  if (rule.operator === "=") ruled = round2(rule.value);
  else if (rule.operator === "-") ruled = round2(Math.max(0, base - rule.value));
  else if (rule.operator === "-%") ruled = round2(Math.max(0, base - (base * rule.value) / 100));
  else if (rule.operator === "+") ruled = round2(base + rule.value);
  else return base;

  return Math.min(base, ruled);
}

/** Prefijo con el que action-applier arma `reason` para las reglas de envío. */
const SHIPPING_REASON_PREFIX = "Precio de envío modificado por promoción: ";

/** Nombre de la regla de envío (el `reason` sin el prefijo del motor). */
export function shippingRuleName(rule: ShippingRule | null): string | null {
  const reason = String(rule?.reason ?? "").trim();
  if (!reason) return null;
  if (!reason.startsWith(SHIPPING_REASON_PREFIX)) return reason;
  return reason.slice(SHIPPING_REASON_PREFIX.length).trim() || null;
}

/** Misma regla (operador y valor): evita re-aplicarla en cada corrida del motor. */
export const sameShippingRule = (a: ShippingRule | null, b: ShippingRule | null) =>
  a?.operator === b?.operator && a?.value === b?.value;
