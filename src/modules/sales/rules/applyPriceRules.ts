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

export async function applyPriceRules<T extends CartItemForRules>(items: T[]): Promise<T[]> {
  try {
    if (items.length === 0) return items;

    // Debug: log items to detect undefined variationIds
    const invalidItems = items.filter(
      (item) => item.variationId == null || isNaN(item.variationId)
    );
    if (invalidItems.length > 0) {
      console.error("applyPriceRules: items with invalid variationId detected:", invalidItems);
    }

    const { data, error } = await supabase.functions.invoke("apply-price-rules", {
      body: { items },
    });

    if (error) {
      console.error("Error calling apply-price-rules:", error);
      return items;
    }

    const returnedItems = data.items as CartItemForRules[];
    return items.map((item, i) => ({
      ...item,
      price: returnedItems[i]?.price ?? item.price,
    }));
  } catch (err) {
    console.error("Error in applyPriceRules:", err);
    return items;
  }
}
