import { supabase } from "@/integrations/supabase/client";
import {
  MovementsApiResponse,
  MovementsFilters,
  MovementsTypesApiResponse,
  SimpleUsers,
  SimpleWarehouses,
} from "../types/Movements.types";
import {
  CMProductsFilter,
  type CMovementsProductsApiResponse,
} from "../types/CreateMovements.types";
import { buildEndpoint } from "@/shared/utils/utils";

export const getStockMovementsApi = async (
  filters: MovementsFilters = {},
): Promise<MovementsApiResponse> => {
  const queryParams = new URLSearchParams(
    Object.entries(filters)
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== "",
      )
      .map(([key, value]) => [key, String(value)]),
  );

  const endpoint = queryParams.toString()
    ? `get-stock-movements?${queryParams.toString()}`
    : "get-stock-movements";

  //const endpoint = "get-stock-movements?page=1&size=20&start_date=2026-01-19&end_date=2026-01-19"

  //const endpoint = "get-stock-movements?page=1"

  const { data, error } = await supabase.functions.invoke(endpoint);

  if (error) {
    console.error("Invoke error:", error);
    throw error;
  }

  return (
    data ?? {
      movementsstock: {
        data: [],
        page: { page: 1, size: 20, total: 0 },
      },
    }
  );
};

export const movementsTypesApi = async (): Promise<
  MovementsTypesApiResponse[]
> => {
  const { data, error } = await supabase
    .from("modules")
    .select("types(id,name,code)")
    .eq("code", "STM")
    .order("name");
  if (error) throw error;
  return data ?? [];
};

export const warehousesListApi = async (): Promise<SimpleWarehouses[]> => {
  const { data, error } = await supabase
    .from("warehouses")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return data ?? [];
};

export const usersListApi = async (): Promise<SimpleUsers[]> => {
  const { data, error } = await supabase
    .from("accounts")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return data ?? [];
};

export const getSaleProducts = async (
  filters: CMProductsFilter = {},
): Promise<CMovementsProductsApiResponse> => {
  const endpoint = buildEndpoint("get-sale-products", filters);

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;
  return data;
};

export const getUserWarehouse = async () => {
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError) {
    throw new Error(authError.message);
  }

  const user = data.user;
  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      `
      warehouse_id,
      warehouses (
        id,
        name
      ),
      accounts (
        name,
        last_name,
        last_name2
      )
    `,
    )
    .eq("UID", user.id)
    .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return profile;
};

export const getMovementsTypesByModule = async () => {
  const { data, error } = await supabase
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
    .eq("modules.code", "STM");

  if (error) throw new Error(error.message);

  return data;
};

export interface TypesApiResponse {
  types: Array<{
    id: number;
    name: string;
    code: string;
  }>;
}

export const getTypes = async (code: string): Promise<TypesApiResponse[]> => {
  const { data, error } = await supabase
    .from("modules")
    .select("types(id,name,code)")
    .eq("code", code)
    .order("name");
  if (error) throw error;
  return data ?? [];
};
/*
export const getUserWarehouse = async () => {
  const { data, error: authError } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  const user = data.user;
  console.log(user);

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("warehouse_id, account_id, warehouses(id, name)")
    .eq("UID", user.id)
    .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .select("name, last_name, last_name2")
    .eq("id", profile.account_id)
    .single();

  if (accountError) {
    throw new Error(accountError.message);
  }

  return {
    warehouse_id: profile.warehouse_id,
    warehouses: profile.warehouses,
    account: account,
  };
};
*/
