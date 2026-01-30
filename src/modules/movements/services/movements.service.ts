import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/utils";
import {
  MovementApiResponse,
  MovementFilters,
  MovementType,
  MovementCategory,
  PaymentMethod,
  BusinessAccount,
} from "../types/Movements.types";

export const movementsApi = async (
  filters: MovementFilters = {}
): Promise<MovementApiResponse> => {
  const endpoint = buildEndpoint("get-movements", filters);

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  console.log("Movements API response:", data);
  console.log("Movements API error:", error);

  if (error) {
    console.error("Error fetching movements:", error);
    throw error;
  }

  // Check if response contains an error from the edge function
  if (data?.error) {
    console.error("Edge function error:", data.error);
    throw new Error(data.error);
  }

  return (
    data ?? {
      movements: {
        data: [],
        page: { p_page: 1, p_size: 20, total: 0 },
      },
    }
  );
};

export const movementTypesApi = async (): Promise<MovementType[]> => {
  const { data, error } = await (supabase as any)
    .from("movement_types")
    .select("id, name")
    .order("name");

  if (error) throw error;
  return data ?? [];
};

export const movementCategoriesApi = async (): Promise<MovementCategory[]> => {
  const { data, error } = await (supabase as any)
    .from("movement_categories")
    .select("id, name")
    .order("name");

  if (error) throw error;
  return data ?? [];
};

export const paymentMethodsApi = async (): Promise<PaymentMethod[]> => {
  const { data, error } = await (supabase as any)
    .from("payment_methods")
    .select("id, name")
    .order("name");

  if (error) throw error;
  return data ?? [];
};

export const businessAccountsApi = async (): Promise<BusinessAccount[]> => {
  const { data, error } = await (supabase as any)
    .from("business_accounts")
    .select("id, name")
    .order("name");

  if (error) throw error;
  return data ?? [];
};
