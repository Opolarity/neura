import { buildEndpoint } from "@/shared/utils/utils";
import {
  UsersApiResponse,
  UsersFilters,
  DocumentLookupPayload,
  DocumentLookupResponse,
} from "../types/Users.types";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";

export const UsersApi = async (
  filters: UsersFilters,
): Promise<UsersApiResponse> => {
  const endpoint = buildEndpoint("get-users", filters);

  const data = await invokeFunction(endpoint, {
    method: "GET",
  });

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
  const data = await invokeFunction("create-users", {
    method: "POST",
    body: userData,
  });

  return data;
};

export const updateUserApi = async (id: number, uid: string, userData: any) => {
  const data = await invokeFunction(`update-user`, {
    method: "POST",
    body: { id, uid, ...userData },
  });

  return data;
};

export const deleteUserApi = async (uid: string) => {
  const data = await invokeFunction(`delete-user`, {
    method: "POST",
    body: { uid },
  });

  return data;
};

export const getUserDocumentApi = async (
  userData: DocumentLookupPayload,
): Promise<DocumentLookupResponse> => {
  const data = await invokeFunction("document-lookup", {
    method: "POST",
    body: userData,
  });

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
  const data = await invokeFunction(
    `get-users-form-data${queryParams}`,
    {
      method: "GET",
    },
  );
  return data;
};

export const getUserByIdApi = async (uid: string) => {
  const data = await invokeFunction(
    `get-users-details?uid=${uid}`,
    {
      method: "GET",
    },
  );
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
