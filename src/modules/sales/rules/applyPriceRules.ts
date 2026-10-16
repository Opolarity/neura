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
}> {
  try {
    if (items.length === 0) return { items, gifts: [], appliedRules: [], discounts: [], shippingRule: null };

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
      return { items, gifts: [], appliedRules: [], discounts: [], shippingRule: null };
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

    return { items: updatedItems, gifts, appliedRules, discounts, shippingRule };

  } catch (err) {
    console.error("Error in applyPriceRules:", err);
    return { items, gifts: [], appliedRules: [], discounts: [], shippingRule: null };
  }
}
