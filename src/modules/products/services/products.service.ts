import { supabase } from "@/integrations/supabase/client";
import { ProductApiResponse } from "../products.types";

export const productsApi = async (): Promise<ProductApiResponse> => {
  const { data, error } = await supabase.functions.invoke("get-products-list");
  if (error) throw error;
  return data ?? [];
};

export const deleteProducts = async (productIds: number[]) => {
  const { data, error } = await supabase.functions.invoke("delete-product", {
    body: { productIds },
  });

  if (error || !data.success) {
    throw new Error(data?.error || "Error al eliminar productos");
  }
};
