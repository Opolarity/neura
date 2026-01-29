import { supabase } from "@/integrations/supabase/client";
import { WarehousesApiResponse, Warehouses, WarehousesFilters, IdModalResponse } from "../types/Warehouses.types";
import { promises } from "dns";

export const WareApi = async (
    filters: WarehousesFilters
): Promise<WarehousesApiResponse> => {

    const queryParams = new URLSearchParams(
        Object.entries(filters)
            .filter(([, value]) => value !== undefined && value !== null && value !== "")
            .map(([key, value]) => [key, String(value)])
    );
    const endpoint = queryParams.toString()
        ? `get-warehouses?${queryParams.toString()}`
        : "get-warehouses";
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


export const GetWarehousesDetails = async (warehouseId: number): Promise<WarehousesApiResponse> => {
    const { data, error } = await supabase.functions.invoke("get-warehouses-details", {
        body: { warehouseID: warehouseId },
    });
    if (error) throw error;
    return data ?? [];
}

export const DeleteWarehouses = async (warehouseId: number): Promise<WarehousesApiResponse> => {
    const { data, error } = await supabase.functions.invoke("delete-warehouses", {
        body: { warehousesID: warehouseId },
    });
    if (error) throw error;
    return data ?? [];
}

export const CreateWarehouses = async (warehouse: Warehouses): Promise<WarehousesApiResponse> => {
    const payload = {
        name: warehouse.name,
        countryID: warehouse.countries,
        stateID: warehouse.states,
        cityID: warehouse.cities,
        neighborhoodsID: warehouse.neighborhoods,
        addres: warehouse.address || "",
        addresreferenc: warehouse.address_reference || "",
        web: warehouse.web ?? false
    };

    const { data, error } = await supabase.functions.invoke("create-warehouses", {
        method: "POST",
        body: payload, // Sending payload directly as req.json() expects it at root
    });
    if (error) throw error;
    return data ?? [];
}

export const UpdateWarehouses = async (warehouse: Warehouses): Promise<WarehousesApiResponse> => {

    const { data, error } = await supabase.functions.invoke("update-warehouse", {
        method: "PUT",
        body: { warehouse },
    });
    if (error) throw error;
    return data ?? [];
}



export const BranchesAPI = async (): Promise<IdModalResponse[]> => {
    const { data, error } = await supabase
        .from("branches")
        .select("id , name")
        .eq("is_active", true)
        .neq("id", 0)
    if (error) throw error;
    return data ?? [];
}

export const CounrtyApi = async (): Promise<IdModalResponse[]> => {
    const { data, error } = await supabase
        .from("countries")
        .select("id , name")
    if (error) throw error;
    return data ?? [];
}

export const StateApi = async (countryID: number): Promise<IdModalResponse[]> => {
    const { data, error } = await supabase
        .from("states")
        .select("id , name")
        .eq("country_id", countryID)
    if (error) throw error;
    return data ?? [];
}

export const CityApi = async (countryID: number, stateID: number): Promise<IdModalResponse[]> => {
    const { data, error } = await supabase
        .from("cities")
        .select("id,name")
        .eq("country_id", countryID)
        .eq("state_id", stateID)
    if (error) throw error;
    return data ?? [];
}

export const NeighborhoodApi = async (countryID: number, stateID: number, cityID: number): Promise<IdModalResponse[]> => {
    const { data, error } = await supabase
        .from("neighborhoods")
        .select("id,name")
        .eq("country_id", countryID)
        .eq("state_id", stateID)
        .eq("city_id", cityID)
    if (error) throw error;
    return data ?? [];
}