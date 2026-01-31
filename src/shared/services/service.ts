import { Status, Type } from "@/types/index.ts";
import { City, Country, Neighborhood, State } from "../../types/locations.ts";
import { supabase } from "../api/supabase";

export const CountriesApi = async (): Promise<Country[]> => {
  const { data, error } = await supabase
    .from("countries")
    .select("id, name, phone_code")
    .order("name");
  if (error) throw error;
  return data ?? [];
};


export const getStatesByCountryIdApi = async (countryId: number): Promise<State[]> => {
  const { data, error } = await supabase
    .from("states")
    .select("id, name, countries(*)")
    .eq("country_id", countryId)
    .order("name");
  if (error) throw error;
  return data ?? [];
};

export const getCitiesByStateIdApi = async (stateId: number, countryId): Promise<City[]> => {
  const { data, error } = await supabase
    .from("cities")
    .select("id, name, states(*, countries(*))")
    .eq("country_id", countryId)
    .eq("state_id", stateId)
    .order("name");
  if (error) throw error;
  return data ?? [];
};

export const getNeighborhoodsByCityIdApi = async (cityId: number, stateId: number, countryId: number): Promise<Neighborhood[]> => {
  const { data, error } = await supabase
    .from("neighborhoods")
    .select("id, name, cities(*,states(*, countries(*)))")
    .eq("country_id", countryId)
    .eq("state_id", stateId)
    .eq("city_id", cityId)
    .order("name");
  if (error) throw error;
  return data ?? [];
};

export const typesByModuleCode = async (moduleCode: string): Promise<Type[]> => {
  const { data, error } = await supabase
    .from("modules")
    .select("types(*)")
    .eq("code", moduleCode)
    .order("name")
    .single();

  if (error) throw error;
  return data?.types ?? [];
};

export const statussesByModuleCode = async (moduleCode: string): Promise<Status[]> => {
  const { data, error } = await supabase
    .from("modules")
    .select("statuses(*)")
    .eq("code", moduleCode)
    .order("name")
    .single();

  if (error) throw error;
  return data?.statuses ?? [];
};

export const getHeaderUserData = async (userUID: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      UID,
      accounts!inner (
        name
      ),
      user_roles (
        roles (
          name
        )
      )
    `)
    .eq("UID", userUID)
    .single();

  if (error) {
    console.error("Error al obtener datos del Header:", error);
    return null;
  }

  return {
    accountName: data.accounts?.name || "Sin Cuenta",
    // Mapeamos los roles: si no hay, devolvemos 'Sin Rol'
    roleName: data.user_roles?.[0]?.roles?.name || "Sin Rol"
  };
};