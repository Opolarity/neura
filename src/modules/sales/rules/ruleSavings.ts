// =============================================
// T-1158: lo que ahorró cada regla de precios en el carrito, para mostrarlo.
//
// Sale de lo que devuelve el motor: `ruleApplications` (cada vez que se aplicó una regla)
// y `ruleItems` (lo que tomó cada regla de cada línea). Es solo informativo: el descuento
// por línea ya está dentro del precio de cada producto y el del envío dentro del costo de
// envío, así que estos montos nunca se vuelven a restar del total.
// =============================================
import type { PriceRuleItem, RuleApplication } from "./applyPriceRules";

const round2 = (n: number) => Math.round(n * 100) / 100;

/** El motor nombra la fila de descuento, las aplicaciones y los `ruleItems` con el nombre de la regla. */
export const ruleSavingKey = (name?: string | null) => (name ?? "").trim().toLowerCase();

/**
 * Aplicaciones de cada regla, con la clave de `ruleSavingKey(nombre)` y en el orden del
 * motor. El motor no conoce el costo del envío: su aplicación toma el ahorro de la fila de
 * envío de `rows` (la que completa `ruleItemsForOrder`) y, si no hubo ahorro, no se lista.
 */
export function groupRuleApplications(
  applications: RuleApplication[],
  rows: PriceRuleItem[],
): Map<string, RuleApplication[]> {
  const shippingSaving = rows.find((r) => r.kind === "shipping")?.discount_amount ?? 0;
  const byRule = new Map<string, RuleApplication[]>();
  for (const a of applications) {
    const app = a.kind === "shipping" ? { ...a, discount_amount: shippingSaving } : a;
    if (app.kind === "shipping" && app.discount_amount <= 0) continue;
    const key = ruleSavingKey(app.rule_name);
    byRule.set(key, [...(byRule.get(key) ?? []), app]);
  }
  return byRule;
}

/** Suma de lo que ahorraron las aplicaciones (negativo = recargo). */
export const sumApplications = (apps: RuleApplication[] | undefined) =>
  round2((apps ?? []).reduce((s, a) => s + a.discount_amount, 0));

/** "1 u gratis", "3 u con descuento", "1 u de regalo", "Envío"... */
export function ruleApplicationLabel(a: RuleApplication): string {
  switch (a.kind) {
    case "gift":
      return `${a.units} u de regalo`;
    case "shipping":
      return "Envío";
    case "subtotal":
      return "Descuento al subtotal";
    case "surcharge":
      return "Recargo";
    default:
      if (a.units <= 0) return "Descuento";
      return a.free ? `${a.units} u gratis` : `${a.units} u con descuento`;
  }
}

/**
 * Ahorro en el precio de cada variación, sumando todas las reglas que la tocaron. Cada
 * regla descuenta sobre el precio que dejó la anterior, así que la suma es exacta (no
 * arrastra el redondeo del precio promediado de la línea).
 *
 * `lines` son las líneas que pasaron por el motor. Si una variación está en dos (otro tipo
 * de inventario), no se sabe a cuál corresponde el ahorro y no se devuelve.
 */
export function ruleSavingsByVariation(
  rows: PriceRuleItem[],
  lines: { variationId: number; isGift?: boolean; fromOrder?: boolean }[],
): Map<number, number> {
  const lineCount = new Map<number, number>();
  for (const l of lines) {
    if (l.isGift || l.fromOrder) continue;
    lineCount.set(l.variationId, (lineCount.get(l.variationId) ?? 0) + 1);
  }
  const byVariation = new Map<number, number>();
  for (const r of rows) {
    if (r.kind !== "item" || r.variation_id == null || r.discount_amount === 0) continue;
    if (lineCount.get(r.variation_id) !== 1) continue;
    byVariation.set(r.variation_id, round2((byVariation.get(r.variation_id) ?? 0) + r.discount_amount));
  }
  return byVariation;
}
