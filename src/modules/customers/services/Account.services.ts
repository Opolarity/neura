import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/utils";
import { AccountsApiResponse, AccountsFilters, AccountType } from "../types/accounts.types";

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

export const accountsTypesApi = async (): Promise<AccountType[]> => {
  const { data: moduleData, error: moduleError } = await supabase
    .from("modules")
    .select("id")
    .eq("code", "CUT")
    .single();

  if (moduleError) throw moduleError;

  const { data, error } = await supabase
    .from("types")
    .select("id,name,code")
    .eq("module_id", moduleData.id)
    .order("name");

  if (error) throw error;
  return data ?? [];
};