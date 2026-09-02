import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/utils";
import {
  Countrie,
  State,
  ShippingApiResponse,
  ShippingFilters,
  City,
  Neighborhood,
  ShippingPayload,
  ShippingDetailsApiResponse,
  ShippingEdit,
} from "../types/Shipping.types";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";

export const ShippingApi = async (
  filters: ShippingFilters = {},
): Promise<ShippingApiResponse> => {
  const endpoint = buildEndpoint("get-shipping-methods", filters);

  const data = await invokeFunction(endpoint, {
    method: "GET",
  });

  console.log("ShippingApi payload:", data);

  return (
    data ?? {
      shippingMethods: {
        data: [],
        page: { page: 1, size: 20, total: 0 },
      },
    }
  );
};

export async function getCountries(): Promise<Countrie[]> {
  const { data, error } = await supabase
    .from("countries")
    .select("id, name")
    .filter("name", "match", "\\S")
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function getAllStates(): Promise<State[]> {
  const { data, error } = await supabase
    .from("states")
    .select("id, name, country_id")
    .filter("name", "match", "\\S")
    .order("name");

  if (error) throw error;

  return data ?? [];
}

export async function getAllCities(): Promise<City[]> {
  const { data, error } = await supabase
    .from("cities")
    .select("id, name, country_id, state_id")
    .filter("name", "match", "\\S")
    .order("name");

  if (error) throw error;

  return data ?? [];
}

export async function getAllNeighborhoods(): Promise<Neighborhood[]> {
  const { data, error } = await supabase
    .from("neighborhoods")
    .select("id, name, country_id, state_id, city_id")
    .filter("name", "match", "\\S")
    .order("name");

  if (error) throw error;

  return data ?? [];
}

export async function getStatesByCountryIdApi(
  countryId: number,
): Promise<State[]> {
  const { data, error } = await supabase
    .from("states")
    .select("id, name")
    .eq("country_id", countryId)
    .filter("name", "match", "\\S")
    .order("name");

  if (error) throw error;

  return data ?? [];
}

export async function getCitiesByStateIdApi(
  countryId: number,
  stateId: number,
): Promise<City[]> {
  const { data, error } = await supabase
    .from("cities")
    .select("id, name")
    .eq("state_id", stateId)
    .eq("country_id", countryId)
    .filter("name", "match", "\\S")
    .order("name");

  if (error) throw error;

  return data ?? [];
}

export async function getDistrictsByCityIdApi(
  countryId: number,
  stateId: number,
  cityId: number,
): Promise<Neighborhood[]> {
  const { data, error } = await supabase
    .from("neighborhoods")
    .select("id, name")
    .eq("city_id", cityId)
    .eq("state_id", stateId)
    .eq("country_id", countryId)
    .filter("name", "match", "\\S")
    .order("name");

  if (error) throw error;

  return data ?? [];
}

export async function createShippingMethodApi(
  payload: ShippingPayload,
): Promise<void> {
  await invokeFunction(
    "create-shipping-method",
    {
      method: "POST",
      body: payload,
    },
  );
}
export async function updateShippingMethodApi(
  payload: ShippingEdit,
): Promise<void> {
  await invokeFunction(
    "update-shipping-method",
    {
      body: payload,
    },
  );
}

export async function getShippingById(
  id: string,
): Promise<ShippingDetailsApiResponse> {
  const data = await invokeFunction(
    "get-details-shipping-method",
    {
      body: { shippingmethodID: Number(id) },
    },
  );

  return data;
}

export async function deleteShippingMethodApi(id: number): Promise<void> {
  const data = await invokeFunction(
    "delete-shipping-method",
    {
      body: {
        methodID: id,
      },
    },
  );
  return data;
}
