import { supabase } from "@/integrations/supabase/client";
import { type CMovementsProductsApiResponse } from "../types/CreateMovements.types";

export const fetchSaleProducts =
  async (): Promise<CMovementsProductsApiResponse> => {
    const endpoint = "get-sale-products";

    const { data, error } = await supabase.functions.invoke(endpoint, {
      method: "GET",
    });

    if (error) throw error;
    return data;
  };
