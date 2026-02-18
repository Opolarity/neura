import { supabase } from "@/integrations/supabase/client";
import {
  BusinessAccountApiResponse,
  BusinessAccountFilters,
  BusinessAccountPayload,
} from "../types/BusinessAccount.types";
import { buildEndpoint } from "@/shared/utils/query";

export const getBusinessAccountsApi = async (
  filters: BusinessAccountFilters
): Promise<BusinessAccountApiResponse> => {
  const endpoint = buildEndpoint("get-business-accounts", filters);

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;
  return data;
};

export const createBusinessAccountApi = async (
  payload: BusinessAccountPayload
) => {
  const { data, error } = await supabase.functions.invoke(
    "create-business-account",
    {
      method: "POST",
      body: payload,
    }
  );

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};

export const updateBusinessAccountApi = async (
  payload: BusinessAccountPayload
) => {
  const { data, error } = await supabase.functions.invoke(
    "update-business-account",
    {
      method: "PUT",
      body: payload,
    }
  );

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};

export const deleteBusinessAccountApi = async (id: number) => {
  const { data, error } = await supabase.functions.invoke(
    "delete-business-account",
    {
      method: "PATCH",
      body: { id },
    }
  );

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
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
