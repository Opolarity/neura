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
    const { data, error } = await supabase.functions.invoke("apply-price-rules", {
      body: { items },
    });

    if (error) {
      console.error("Error calling apply-price-rules:", error);
      return items; // fallback: return original items
    }

    // Merge returned prices back into original items to preserve any extra fields
    const returnedItems = data.items as CartItemForRules[];
    return items.map((item, i) => ({
      ...item,
      price: returnedItems[i]?.price ?? item.price,
    }));
  } catch (err) {
    console.error("Error in applyPriceRules:", err);
    return items; // fallback
  }
}
