import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/utils";
import { AccountsApiResponse, AccountsFilters, AccountsTypesApiResponse } from "../types/accounts.types";

export const accountsApi = async (
  filters: AccountsFilters
): Promise<AccountsApiResponse> => {
  const endpoint = buildEndpoint("get-accounts", filters);

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });


  if (error) {
    console.error("Invoke error in rolesApi:", error);
    throw error;
  }

  return (
    data ?? {
      accountsdata: {
        data: [],
        page: { page: 1, size: 20, total: 0 },
      },
    }
  );
};

export const accountsTypesApi = async (): Promise<
  AccountsTypesApiResponse[]
> => {
  const { data, error } = await supabase
    .from("modules")
    .select("types(id,name,code)")
    .eq("code", "CLI")
    .order("name");
  if (error) throw error;
  return data as unknown as AccountsTypesApiResponse[];
};