import { Branch, BusinessAccount, Class, PaymentMethod, Situation, Status, Type } from "@/types/index.ts";
import { City, Country, Neighborhood, State } from "../../types/locations.ts";
import { supabase } from "../api/supabase";
import { TypesApiResponse } from "../types/type.ts";
import { PriceList } from "@/types/price.ts";
import { Warehouse } from "@/types/warehouse.ts";

export const CountriesApi = async (): Promise<Country[]> => {
  const { data, error } = await supabase
    .from("countries")
    .select("id, name, phone_code")
    .order("name");
  if (error) throw error;
  return data ?? [];
};

//GET COUNTRY//
export const getStatesByCountryIdApi = async (countryId: number): Promise<State[]> => {
  const { data, error } = await supabase
    .from("states")
    .select("id, name, countries(*)")
    .eq("country_id", countryId)
    .order("name");
  if (error) throw error;
  return data ?? [];
};

//GET STATES//
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

//GET NEIGHBORHOODS//
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

//GET TYPES BY MODULE CODE//
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

//GET STATUSSES BY MODULE CODE//
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

//GET SITUATIONS BY MODULE CODE//
export const situationsByModuleCode = async (moduleCode: string): Promise<Situation[]> => {
  const { data, error } = await supabase
    .from("modules")
    .select("situations(*)")
    .eq("code", moduleCode)
    .order("name")
    .single();

  if (error) throw error;
  return data?.situations ?? [];
};

//GET STATUSES BY SITUATION ID//
export const statusesBySituation = async (situationId: number) => {
  const { data, error } = await supabase
    .from("situations")
    .select(`
      id,
      statuses (
        id,
        name
      )
    `)
    .eq("id", situationId)
    .single();

  if (error) throw error;
  return data?.statuses ?? [];
};

//GET SITUATION BY MODULE CODE AND STATUS CODE//

export const situationByModuleandStatus = async (moduleCode: string, statusCode: string): Promise<Situation[]> => {
  const { data, error } = await supabase
    .from("modules")
    .select("situations(*)")
    .eq("code", moduleCode)
    .eq("statuses.code", statusCode)
    .order("name")
    .single();

  if (error) throw error;
  return data?.situations ?? [];
};



//GET HEADER USER DATA//
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

//GET TYPES BY CODE//
export const getTypes = async (code: string): Promise<TypesApiResponse[]> => {
  const { data, error } = await supabase
    .from("modules")
    .select("types(id,name,code)")
    .eq("code", code)
    .order("name");
  if (error) throw error;
  return data ?? [];
};


//GET PRICE LIST IS_ACTIVE TRUE//

export const getPriceListIsActiveTrue = async (): Promise<PriceList[]> => {
  const { data, error } = await supabase
    .from("price_list")
    .select("*")
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching active price list:", error.message);
    return [];
  }

  return data || [];
};

//GET BUSINESS ACCOUNT IS_ACTIVE TRUE//

export const getBusinessAccountIsActiveTrue = async () => {
  const { data, error } = await supabase
    .from("business_accounts")
    .select("*")
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching active business accounts:", error.message);
    return [];
  }

  return data || [];
};

//GET PAYMENT METHODS IS_ACTIVE TRUE//

export const getPaymentMethodsIsActiveTrue = async (): Promise<PaymentMethod[]> => {
  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching active payment methods:", error.message);
    return [];
  }

  return data || [];
};


//GET PAYMENT METHODS IS_ACTIVE TRUE AND ACTIVE TRUE//

export const getPaymentMethodsIsActiveTrueAndActiveTrue = async (): Promise<(PaymentMethod & { business_accounts?: { name: string } })[]> => {
  const { data, error } = await supabase
    .from("payment_methods")
    .select("*, business_accounts(name)")
    .eq("is_active", true)
    .eq("active", true);

  if (error) {
    console.error("Error fetching active payment methods:", error.message);
    return [];
  }

  return (data as any) || [];
};


//GET TERMS GROUP IS ACTIVE TRUE//

export const getTermsGroupIsActiveTrue = async () => {
  const { data, error } = await supabase
    .from("term_groups")
    .select("*")
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching active terms group:", error.message);
    return [];
  }

  return data || [];
};

//GET WAREHOUSES IS_ACTIVE TRUE//

export const getWarehousesIsActiveTrue = async (): Promise<Warehouse[]> => {
  const { data, error } = await supabase
    .from("warehouses")
    .select("*")
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching active warehouses:", error.message);
    return [];
  }

  return data || [];
};

//GET BRANCHES IS_ACTIVE TRUE//

export const getBranchesIsActiveTrue = async () => {
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .eq("is_active", true);

  if (error) throw error;
  return data || [];
};

//GET CLASSES BY MODULE CODE//
export const classesByModuleCode = async (moduleCode: string): Promise<Class[]> => {
  const { data, error } = await supabase
    .from("modules")
    .select("classes(*)")
    .eq("code", moduleCode)
    .order("name")
    .single();

  if (error) throw error;
  return data?.classes ?? [];
};

//GET USERS LIST IS_ACTIVE TRUE AND TYPE USER//

export const getAccountsByModuleCodeAndTypeUser = async () => {
  const { data, error } = await supabase
    .from("accounts")
    .select(`
      *,
      account_types!inner(
        *,
        types!inner(
          id,
          code,
          module_id,
          modules!inner(
            id,
            code
          )
        )
      )
    `)
    .eq("is_active", true)
    .eq("account_types.types.code", "COL")
    .eq("account_types.types.modules.code", "CUT");

  if (error) throw error;
  return data ?? [];
};

//GET POS SALE TYPES BY BRANCH//
export const getPosSaleTypesByBranch = async (branchId: number) => {
  const { data, error } = await supabase
    .from("sale_type_branches")
    .select(`
      sale_type_id,
      sale_types!inner (
        id,
        name,
        business_acount_id
      )
    `)
    .eq("branch_id", branchId)
    .eq("sale_types.pos_sale_type", true)
    .eq("sale_types.is_active", true);

  if (error) {
    console.error("Error fetching POS sale types:", error.message);
    return [];
  }

  return (data || []).map((item: any) => ({
    id: item.sale_types.id,
    name: item.sale_types.name,
    businessAccountId: item.sale_types.business_acount_id,
  }));
};
