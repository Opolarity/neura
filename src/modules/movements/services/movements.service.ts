import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/utils";
import {
  MovementApiResponse,
  MovementFilters,
  MovementType,
  MovementCategory,
  PaymentMethod,
  BusinessAccount,
  PaymentMethodWithAccount,
  MovementClass,
  CurrentUserProfile,
  CreateMovementPayload,
  CreateMovementResponse,
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
    .from("types")
    .select(
      `
    id,
    name,
    modules!inner (
      id
    )
  `,
    )
    .eq("modules.code", "MOV");

  if (error) throw error;
  return data ?? [];
};

export const movementCategoriesApi = async (): Promise<MovementCategory[]> => {
  const { data, error } = await (supabase as any)
    .from("classes")
    .select("id, name")
    .order("name");

  if (error) throw error;
  return data ?? [];
};



// =============================================================================
// SERVICIOS PARA EL FORMULARIO DE MOVIMIENTOS
// =============================================================================

export const paymentMethodsWithAccountApi = async (): Promise<
  PaymentMethodWithAccount[]
> => {
  const { data, error } = await (supabase as any)
    .from("payment_methods")
    .select("id, name, business_account_id, business_accounts(name)")
    .eq("active", true)
    .order("name");

  if (error) throw error;
  return data ?? [];
};

export const movementClassesApi = async (): Promise<MovementClass[]> => {
  // First get the module id for 'MOV'
  const { data: moduleData, error: moduleError } = await (supabase as any)
    .from("modules")
    .select("id")
    .eq("code", "MOV")
    .single();

  if (moduleError) throw moduleError;

  // Then get classes for that module
  const { data, error } = await (supabase as any)
    .from("classes")
    .select("id, name, code")
    .eq("module_id", moduleData.id)
    .order("name");

  if (error) throw error;
  return data ?? [];
};

export const currentUserProfileApi = async (
  userId: string
): Promise<CurrentUserProfile> => {
  const { data, error } = await (supabase as any)
    .from("profiles")
    .select("UID, accounts:account_id(name, last_name)")
    .eq("UID", userId)
    .single();

  if (error) throw error;

  return {
    UID: data.UID,
    name: data.accounts?.name || "",
    last_name: data.accounts?.last_name || "",
  };
};

export const createMovementApi = async (
  payload: CreateMovementPayload
): Promise<CreateMovementResponse> => {
  const { data, error } = await supabase.functions.invoke("create-movements", {
    method: "POST",
    body: payload,
  });

  if (error) {
    console.error("Error creating movement:", error);
    throw error;
  }

  if (data?.error) {
    console.error("Edge function error:", data.error);
    throw new Error(data.error);
  }

  return data;
};
