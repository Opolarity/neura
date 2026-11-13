// =============================================
// Price Rules Engine
// Calls the process-price-rules edge function
// to get cart items with prices adjusted by rules.
// =============================================
import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import type { ShippingRule } from "./shippingRule";


interface CartItemForRules {
  variationId: number;
  quantity: number;
  price: number;
  originalPrice: number;
  [key: string]: any;
}

export interface AppliedRule {
  message: string;
  rule_name: string;
  rule_code: string | null;
  url: string | null;
}

export interface GiftItem {
  variationId: number;
  productName: string;
  sku: string;
  quantity: number;
}

export interface DiscountResult {
  name: string;
  amount: number;
  code: string;
  note?: string;
}

/**
 * T-1158: fila de `ruleItems` del motor: qué unidades tomó cada regla y cuánto les
 * descontó, decidido antes de promediar el precio de la línea. Viaja tal cual a
 * create-order / update-order como `price_rule_items` para el reporte de reglas.
 */
export interface PriceRuleItem {
  rule_id: number;
  rule_name: string;
  rule_code: string | null;
  kind: "item" | "subtotal" | "surcharge" | "gift" | "shipping";
  variation_id: number | null;
  product_id: number | null;
  /** Unidades que entraron en la promoción (pagadas y bonificadas). */
  quantity: number;
  /** De esas, las que recibieron el descuento. */
  discounted_qty: number;
  unit_price: number | null;
  /** Negativo = recargo. */
  discount_amount: number;
  sales_amount: number;
}

/**
 * T-1158: cada vez que el motor aplicó una regla (un grupo de "lleva X paga Y", un pack,
 * una línea con precio rebajado, un regalo, el envío). Solo para mostrar; no se guarda.
 */
export interface RuleApplication {
  rule_id: number;
  rule_name: string;
  rule_code: string | null;
  kind: PriceRuleItem["kind"];
  /** Unidades con descuento (en un regalo, las regaladas; 0 en envío y subtotal). */
  units: number;
  /** Negativo = recargo. En envío llega en 0: el motor no conoce el costo del método. */
  discount_amount: number;
  /** Las unidades con descuento salieron gratis. */
  free: boolean;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * T-1158: filas a guardar con el pedido. El motor no conoce el costo del envío: la
 * fila de envío se completa con lo que el cliente se ahorró (costo del método − lo
 * cobrado) y se quita si no hubo envío o no se ahorró nada. Mismo criterio que
 * `_shared/order-price-rule-items.ts` en el backend.
 */
export function ruleItemsForOrder(
  rows: PriceRuleItem[],
  baseShippingCost: number | null,
  chargedShippingCost: number | null,
): PriceRuleItem[] {
  // Sin costo del método o sin envío cobrado (null / NaN) no hay ahorro que registrar.
  const saved =
    Number.isFinite(baseShippingCost) && Number.isFinite(chargedShippingCost)
      ? round2((baseShippingCost as number) - (chargedShippingCost as number))
      : 0;
  return rows.flatMap((r) => {
    if (r.kind !== "shipping") return [r];
    if (saved <= 0) return [];
    return [{ ...r, discount_amount: saved, sales_amount: round2(chargedShippingCost ?? 0) }];
  });
}

// Fila de order_discounts escrita por el motor de reglas (con el código de la regla).
export interface OrderDiscountRule {
  name: string;
  code: string;
  discount_amount: number;
}

// Filas escritas por sp_fch_apply_franchise_sale (promos de consignación). Ahí la repetición es
// legítima —una fila por venta reportada del franquiciado— así que nunca se emparejan ni se
// pisan con lo que devuelve el motor de reglas del ERP.
export const isFranchiseRow = (code?: string | null) =>
  (code ?? "").toUpperCase().startsWith("FCH-PROMO");

export async function applyPriceRules<T extends CartItemForRules>(
  items: T[],
  priceListId: number | string,
  userId?: string | null,
  accountId?: number | null,
  paymentMethodCode?: string | null,
  couponCode?: string | null
): Promise<{
  items: T[];
  gifts: GiftItem[];
  appliedRules: AppliedRule[];
  discounts: DiscountResult[];
  shippingRule: ShippingRule | null;
  /** T-340: id del cupón (para registrar su uso al crear la orden); solo llega si el cupón cambió el carrito. */
  couponDiscountId: number | null;
  /** T-340: motivo por el que el motor rechazó el cupón. */
  couponError: string | null;
  /** T-1158: unidades y descuento de cada regla, para guardarlos con el pedido. */
  ruleItems: PriceRuleItem[];
  /** T-1158: cada vez que se aplicó cada regla, para listarlas en la venta. */
  ruleApplications: RuleApplication[];
  /** true si no se pudo consultar al motor: los ítems vuelven sin cambios. */
  failed: boolean;
}> {
  const empty = { gifts: [], appliedRules: [], discounts: [], shippingRule: null, couponDiscountId: null, couponError: null, ruleItems: [], ruleApplications: [] };
  try {
    if (items.length === 0) return { items, ...empty, failed: false };

    // Mapear campos de Neura → formato que espera la EF
    const payloadItems = items.map((item) => ({
      variationId: item.variationId,
      quantity: item.quantity,
      product_price: item.originalPrice,   // precio base de catálogo
      regular_price: item.originalPrice,   // precio base de catálogo
      sale_price: null,
    }));

    // Si el motor de reglas falla, la venta sigue con los precios de catálogo:
    // es degradación deliberada, no un error que deba cortar el flujo. Por eso
    // aquí se captura en vez de dejar que `invokeFunction` propague.
    let data: {
      items?: unknown[];
      appliedRules?: unknown[];
      gifts?: unknown[];
      discounts?: unknown[];
      shippingRule?: { enabled?: boolean; operator?: string | null; value?: number | null; reason?: string };
      couponDiscountId?: number | null;
      couponError?: string | null;
      ruleItems?: unknown[];
      ruleApplications?: unknown[];
    };
    try {
      data = await invokeFunction("process-price-rules", {
        body: {
          items: payloadItems,
          priceListId: Number(priceListId),
          userId: userId ?? null,
          accountId: accountId ?? null,
          paymentMethodCode: paymentMethodCode ?? null,
          couponCode: couponCode ?? null,
        },
      });
    } catch (error) {
      console.error("Error calling process-price-rules:", error);
      return { items, ...empty, failed: true };
    }

    const returnedItems = (data?.items || []) as any[];
    const appliedRules: AppliedRule[] = (data?.appliedRules || []).map((r: any) => ({
      message: r.message,
      rule_name: r.rule_name,
      rule_code: r.rule_code,
      url: r.url,
    }));
    const gifts: GiftItem[] = (data?.gifts || []).map((g: any) => ({
      variationId: g.variation_id,
      productName: g.product_name,
      sku: g.sku,
      quantity: g.quantity,
    }));
    const discounts: DiscountResult[] = (data?.discounts || []).map((d: any) => ({
      name: d.name,
      amount: d.discount,
      code: d.code,
      note: d.note,
    }));

    // Mapa variationId → product_price calculado por la EF
    const priceByVariation = new Map<number, number>(
      returnedItems.map((i: any) => [i.variationId, i.product_price])
    );

    const updatedItems = items.map((item) => {
      const ruledPrice = priceByVariation.get(item.variationId);
      return {
        ...item,
        price: ruledPrice !== undefined ? ruledPrice : item.price,
      };
    });

    // T-360: regla de envío (envío gratis, descuento o precio fijo). Solo se
    // devuelve si el motor la habilitó.
    const sr = data?.shippingRule;
    const shippingRule: ShippingRule | null =
      sr?.enabled && sr.operator && sr.value !== null && sr.value !== undefined
        ? { operator: sr.operator as ShippingRule["operator"], value: Number(sr.value), reason: sr.reason ?? "" }
        : null;

    return {
      items: updatedItems,
      gifts,
      appliedRules,
      discounts,
      shippingRule,
      couponDiscountId: data?.couponDiscountId ?? null,
      couponError: data?.couponError ?? null,
      ruleItems: Array.isArray(data?.ruleItems) ? (data.ruleItems as PriceRuleItem[]) : [],
      ruleApplications: Array.isArray(data?.ruleApplications) ? (data.ruleApplications as RuleApplication[]) : [],
      failed: false,
    };

  } catch (err) {
    console.error("Error in applyPriceRules:", err);
    return { items, ...empty, failed: true };
  }
}
