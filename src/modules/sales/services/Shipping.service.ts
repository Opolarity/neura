import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/utils";
import { Countrie, State, ShippingApiResponse, ShippingFilters, City, Neighborhood, ShippingPayload } from "../types/Shipping.types";

export const ShippingApi = async (
  filters: ShippingFilters = {}
): Promise<ShippingApiResponse> => {
  const endpoint = buildEndpoint("get-shipping-methods", filters);

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) {
    console.error("Invoke error:", error);
    throw error;
  }

  console.log("ShippingApi payload:", data);

  return data ?? {
    shippingMethods: {
      data: [],
      page: { page: 1, size: 20, total: 0 },
    },
  };
};

export async function getCountries(): Promise<Countrie[]> {
  let query = supabase
    .from("countries")
    .select("id, name")
    .order("name");

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getStatesByCountryIdApi(
  countryId: number
): Promise<State[]> {
  const { data, error } = await supabase
    .from("states")
    .select("id, name")
    .eq("country_id", countryId)
    .order("name");

  if (error) throw error;

  return data ?? [];
}

export async function getCitiesByStateIdApi(
  countryId: number,
  stateId: number
): Promise<City[]> {
  const { data, error } = await supabase
    .from("cities")
    .select("id, name")
    .eq("state_id", stateId)
    .eq("country_id", countryId)
    .order("name");

  if (error) throw error;

  return data ?? [];
}

export async function getDistrictsByCityIdApi(
  countryId: number,
  stateId: number,
  cityId: number
): Promise<Neighborhood[]> {
  const { data, error } = await supabase
    .from("neighborhoods")
    .select("id, name")
    .eq("city_id", cityId)
    .eq("state_id", stateId)
    .eq("country_id", countryId)
    .order("name");

  if (error) throw error;

  return data ?? [];
}

export async function createShippingMethodApi(
  payload: ShippingPayload
): Promise<void> {
  const { data, error } = await supabase.functions.invoke("create-shipping-method", {
    method: "POST",
    body: payload,
  });

  if (error) {
    console.error("Invoke error:", error);
    throw error;
  }
}

export async function getShippingById(id: string): Promise<ShippingApiResponse> {
  const { data, error } = await supabase.functions.invoke("get-details-shipping-method", {
    body: { shippingmethodID: Number(id) },
  });

  if (error) {
    console.error("Invoke error:", error);
    throw error;
  }

  console.log("ShippingApi payload:", data);

  return data ?? {
    shippingMethods: {
      data: [],
      page: { page: 1, size: 20, total: 0 },
    },
  };
}
