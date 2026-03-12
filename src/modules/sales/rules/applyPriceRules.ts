// =============================================
// Price Rules Engine
// Calls the apply-price-rules edge function
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
  type: "pack" | "level" | "gift";
  label: string;
  detail?: string;
}

export interface GiftItem {
  variationId: number;
  productName: string;
  sku: string;
  quantity: number;
}

export async function applyPriceRules<T extends CartItemForRules>(
  items: T[],
  priceListId: number | string,
  userId?: string | null,
  accountId?: number | null
): Promise<{ items: T[]; gifts: GiftItem[]; appliedRules: AppliedRule[] }> {
  try {
    if (items.length === 0) return { items, gifts: [], appliedRules: [] };

    // Mapear campos de Neura → formato que espera la EF
    const payloadItems = items.map((item) => ({
      variationId: item.variationId,
      quantity: item.quantity,
      product_price: item.originalPrice,   // precio base de catálogo
      regular_price: item.originalPrice,   // precio base de catálogo
      sale_price: null,
    }));

    const { data, error } = await supabase.functions.invoke("apply-price-rules", {
      body: {
        items: payloadItems,
        priceListId: Number(priceListId),
        userId: userId ?? null,
        accountId: accountId ?? null,
      },
    });

    if (error) {
      console.error("Error calling apply-price-rules:", error);
      return { items, gifts: [], appliedRules: [] };
    }

    const returnedItems = (data?.items || []) as any[];
    const appliedRules = (data?.appliedRules || []) as AppliedRule[];
    const gifts: GiftItem[] = (data?.gifts || []).map((g: any) => ({
      variationId: g.variation_id,
      productName: g.product_name,
      sku: g.sku,
      quantity: g.quantity,
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

    return { items: updatedItems, gifts, appliedRules };

  } catch (err) {
    console.error("Error in applyPriceRules:", err);
    return { items, gifts: [], appliedRules: [] };
  }
}