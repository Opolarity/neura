import { supabase } from "@/integrations/supabase/client";
import {
  BusinessAccountApiResponse,
  BusinessAccountFilters,
  BusinessAccountPayload,
} from "../types/BusinessAccount.types";
import { buildEndpoint } from "@/shared/utils/query";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";

export const getBusinessAccountsApi = async (
  filters: BusinessAccountFilters
): Promise<BusinessAccountApiResponse> => {
  const endpoint = buildEndpoint("get-business-accounts", filters);

  const data = await invokeFunction(endpoint, {
    method: "GET",
  });
  return data;
};

export const createBusinessAccountApi = async (
  payload: BusinessAccountPayload
) => {
  const data = await invokeFunction(
    "create-business-account",
    {
      method: "POST",
      body: payload,
    }
  );
  return data;
};

export const updateBusinessAccountApi = async (
  payload: BusinessAccountPayload
) => {
  const data = await invokeFunction(
    "update-business-account",
    {
      method: "PUT",
      body: payload,
    }
  );
  return data;
};

export const deleteBusinessAccountApi = async (id: number) => {
  const data = await invokeFunction(
    "delete-business-account",
    {
      method: "PATCH",
      body: { id },
    }
  );
  return data;
};

export const getBusinessAccountTypesApi = async (): Promise<
  { id: number; name: string }[]
> => {
  const { data, error } = await supabase
    .from("types")
    .select("id, name")
    .order("name");

  if (error) throw error;
  return data ?? [];
};
