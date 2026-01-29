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


export const DeleteWarehouses = async (warehouseId: number): Promise<WarehousesApiResponse> => {
    const { data, error } = await supabase.functions.invoke("delete-warehouses", {
        body: { warehousesID: warehouseId },
    });
    if (error) throw error;
    return data ?? [];
}

export const CreateWarehouses = async (warehouse: Warehouses): Promise<WarehousesApiResponse> => {
    // Map to the specific payload structure expected by Deno (including typos)
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
    // Assuming update follows similar structure or the existing body wrapper.
    // However, usually update also needs specific fields. 
    // START ANALYSIS: The prompt didn't show the update code, but standard practice suggests matching the create structure or existing.
    // The existing code was: body: { warehouse }. 
    // I will keep it wrapper-based for now unless I see the update code, BUT I should probably map the fields too if the backend changed.
    // Safer to keep existing wrapper for Update if I haven't seen the code, 
    // BUT the Create one definitely needs the flat structure shown in user prompt.
    // Let's stick to the previous pattern for Update but ensure Types match.

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