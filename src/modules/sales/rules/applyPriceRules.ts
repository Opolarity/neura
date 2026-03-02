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

    const missingProductIdItems = items.filter(
      (item) => Number.isFinite(item.variationId) && !Number.isFinite(item.productId)
    );

    const missingVariationIds = [
      ...new Set(missingProductIdItems.map((item) => item.variationId)),
    ];

    const productIdByVariation = new Map<number, number>();
    if (missingVariationIds.length > 0) {
      const { data: variationRows, error: variationError } = await supabase
        .from("variations")
        .select("id, product_id")
        .in("id", missingVariationIds);

      if (variationError) {
        console.error("applyPriceRules: error resolving productId by variationId", variationError);
      } else {
        (variationRows || []).forEach((row) => {
          if (Number.isFinite(row.id) && Number.isFinite(row.product_id)) {
            productIdByVariation.set(row.id, row.product_id);
          }
        });
      }
    }

    const payloadItems = items.map((item) => {
      const resolvedProductId = Number.isFinite(item.productId)
        ? item.productId
        : productIdByVariation.get(item.variationId);

      return {
        ...item,
        productId: resolvedProductId,
        product_id: resolvedProductId,
        variation_id: item.variationId,
        product_variation_id: item.variationId,
      };
    });

    const { data, error } = await supabase.functions.invoke("apply-price-rules", {
      body: { items: payloadItems },
    });

    if (error) {
      console.error("Error calling apply-price-rules:", error);
      return items;
    }

    const returnedItems = (data?.items || []) as CartItemForRules[];
    const returnedPriceByVariation = new Map<number, number>();

    returnedItems.forEach((item) => {
      const variationId = item.variationId ?? item.variation_id ?? item.product_variation_id;
      if (Number.isFinite(variationId) && Number.isFinite(item.price)) {
        returnedPriceByVariation.set(variationId, item.price);
      }
    });

    return items.map((item, index) => ({
      ...item,
      price: returnedPriceByVariation.get(item.variationId) ?? returnedItems[index]?.price ?? item.price,
    }));
  } catch (err) {
    console.error("Error in applyPriceRules:", err);
    return items;
  }
}
