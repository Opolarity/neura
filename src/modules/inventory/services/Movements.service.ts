import { supabase } from "@/integrations/supabase/client";
import {
  MovementsApiResponse,
  MovementsFilters,
  MovementsTypesApiResponse,
  SimpleUsers,
  SimpleWarehouses,
  ProductSalesApiResponse,
  ProductSalesFilter,
} from "../types/Movements.types";
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


export const usersListApi = async (): Promise<SimpleUsers[]> => {
  const { data, error } = await supabase
    .from("accounts")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return data ?? [];
};

export const getSaleProducts = async (
  filters: ProductSalesFilter = {},
): Promise<ProductSalesApiResponse> => {
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

export const getStockByVariationAndTypeApi = async (
  productVariationId: number,
  stockTypeId: number,
  warehouseId: number,
) => {

  const endpoint = buildEndpoint("get-stock-by-variation-and-type", {
    productVariationId,
    stockTypeId,
    warehouseId,
  });
  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;
  return data;
};

interface MovementPayload {
  product_variation_id: number;
  quantity: number;
  stock_type_id: number;
  movements_type_id: number;
  warehouse_id: number;
}

export const createStockMovementsEntranceApi = async (newMovement: MovementPayload[]) => {
  const { data, error } = await supabase.functions.invoke("create-stock-movements-entrance", {
    method: "POST",
    body: newMovement
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

interface MovementPayload2 {
  warehouse_id: number;
  products: Array<{
    product_variation_id: number;
    quantity: number;
    origin_stock_type_code: string;
    destination_stock_type_code: string;
  }>;
}

export const createMovementsTypeStockApi = async (newMovement: MovementPayload2) => {
  const { data, error } = await supabase.functions.invoke("create-movements-type-stock", {
    method: "POST",
    body: newMovement
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

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
