// =============================================
// Price Rules Engine
// Calls the process-price-rules edge function
// to get cart items with prices adjusted by rules.
// =============================================

import { supabase } from "@/integrations/supabase/client";

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

export async function applyPriceRules<T extends CartItemForRules>(
  items: T[],
  priceListId: number | string,
  userId?: string | null,
  accountId?: number | null,
  paymentMethodCode?: string | null,
  couponCode?: string | null
): Promise<{ items: T[]; gifts: GiftItem[]; appliedRules: AppliedRule[]; discounts: DiscountResult[] }> {
  try {
    if (items.length === 0) return { items, gifts: [], appliedRules: [], discounts: [] };

    // Mapear campos de Neura → formato que espera la EF
    const payloadItems = items.map((item) => ({
      variationId: item.variationId,
      quantity: item.quantity,
      product_price: item.originalPrice,   // precio base de catálogo
      regular_price: item.originalPrice,   // precio base de catálogo
      sale_price: null,
    }));

    const { data, error } = await supabase.functions.invoke("process-price-rules", {
      body: {
        items: payloadItems,
        priceListId: Number(priceListId),
        userId: userId ?? null,
        accountId: accountId ?? null,
        paymentMethodCode: paymentMethodCode ?? null,
        couponCode: couponCode ?? null,
      },
    });

    if (error) {
      console.error("Error calling process-price-rules:", error);
      return { items, gifts: [], appliedRules: [], discounts: [] };
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

    return { items: updatedItems, gifts, appliedRules, discounts };

  } catch (err) {
    console.error("Error in applyPriceRules:", err);
    return { items, gifts: [], appliedRules: [], discounts: [] };
  }
}
