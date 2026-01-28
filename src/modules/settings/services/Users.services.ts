import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/utils";
import {
  UsersApiResponse,
  UsersFilters,
  DocumentLookupPayload,
  DocumentLookupResponse,
} from "../types/Users.types";

export const UsersApi = async (
  filters: UsersFilters,
): Promise<UsersApiResponse> => {
  const endpoint = buildEndpoint("get-users", filters);

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) {
    console.error("Invoke error in usersApi:", error);
    throw error;
  }

  return (
    data ?? {
      usersdata: {
        data: [],
        page: { page: 1, size: 20, total: 0 },
      },
    }
  );
};

export const createUserApi = async (userData: any) => {
  const { data, error } = await supabase.functions.invoke("create-users", {
    method: "POST",
    body: userData,
  });

  if (error) {
    console.error("Invoke error in createUserApi:", error);
    throw error;
  }

  return data;
};

export const updateUserApi = async (id: number, uid: string, userData: any) => {
  const { data, error } = await supabase.functions.invoke(`update-user`, {
    method: "POST",
    body: { id, uid, ...userData },
  });

  if (error) {
    console.error("Invoke error in updateUserApi:", error);
    throw error;
  }

  return data;
};

export const deleteUserApi = async (uid: string) => {
  const { data, error } = await supabase.functions.invoke(`delete-user`, {
    method: "POST",
    body: { uid },
  });

  if (error) {
    console.error("Invoke error in deleteUserApi:", error);
    throw error;
  }

  return data;
};

export const getUserDocumentApi = async (
  userData: DocumentLookupPayload,
): Promise<DocumentLookupResponse> => {
  const { data, error } = await supabase.functions.invoke("document-lookup", {
    method: "POST",
    body: userData,
  });

  if (error) {
    console.error("Invoke error in getUserDocumentApi:", error);
    throw error;
  }

  return data;
};

export const getUsersFormDataApi = async (params?: {
  country_id?: number;
  state_id?: number;
  city_id?: number;
}) => {
  const queryParams = params
    ? "?" + new URLSearchParams(params as any).toString()
    : "";
  const { data, error } = await supabase.functions.invoke(
    `get-users-form-data${queryParams}`,
    {
      method: "GET",
    },
  );
  if (error) throw error;
  return data;
};

export const getUserByIdApi = async (id: number) => {
  const { data, error } = await supabase.functions.invoke(
    `get-users-details?id=${id}`,
    {
      method: "GET",
    },
  );
  if (error) throw error;
  return data;
};

export const getRolesListApi = async () => {
  const data = await getUsersFormDataApi();
  return data.roles || [];
};

export const getWarehousesListApi = async () => {
  const data = await getUsersFormDataApi();
  return data.warehouses || [];
};

export const getBranchesListApi = async () => {
  const data = await getUsersFormDataApi();
  return data.branches || [];
};

export const getDocumentTypesApi = async () => {
  const data = await getUsersFormDataApi();
  return data.documentTypes || [];
};

export const getAccountTypesListApi = async () => {
  const data = await getUsersFormDataApi();
  return data.accountTypes || [];
};

export const getCountriesListApi = async () => {
  const data = await getUsersFormDataApi();
  return data.countries || [];
};

export const getStatesListApi = async (countryId: number) => {
  return await getUsersFormDataApi({ country_id: countryId });
};

export const getCitiesListApi = async (countryId: number, stateId: number) => {
  return await getUsersFormDataApi({
    country_id: countryId,
    state_id: stateId,
  });
};

export const getNeighborhoodsListApi = async (
  countryId: number,
  stateId: number,
  cityId: number,
) => {
  return await getUsersFormDataApi({
    country_id: countryId,
    state_id: stateId,
    city_id: cityId,
  });
};
