import { supabase } from "@/integrations/supabase/client";
import { ShippingApiResponse, ShippingFilters } from "../types/Shipping.types";





export const ShippingApi = async (
  filters: ShippingFilters = {}
): Promise<ShippingApiResponse> => {

  const queryParams = new URLSearchParams(
    Object.entries(filters)
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== ""
      )
      .map(([key, value]) => [key, String(value)])
  );

  const endpoint = queryParams.toString()
    ? `get-shipping-methods?${queryParams.toString()}`
    : "get-shipping-methods";

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });


  if (error) {
    console.error("Invoke error:", error);
    throw error;
  }

  console.log("ShippingApi payload:", data);

  return data ?? {
    shippingMethods: {
      data: [],
      page: { page: 1, size: 20, total: 0 },
    },
  };
};