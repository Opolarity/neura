import { supabase } from "@/integrations/supabase/client";
import { BranchesApiResponse, Branch, BranchesFilters, IdNameResponse } from "../types/Branches.types";

export const BranchesApi = async (
    filters: BranchesFilters
): Promise<BranchesApiResponse> => {
    const queryParams = new URLSearchParams(
        Object.entries(filters)
            .filter(([, value]) => value !== undefined && value !== null && value !== "")
            .map(([key, value]) => [key, String(value)])
    );
    const endpoint = queryParams.toString()
        ? `get-branches?${queryParams.toString()}`
        : "get-branches";
    const { data, error } = await supabase.functions.invoke(endpoint, {
        method: "GET",
    });

    if (error) {
        console.error("Invoke error in branchesApi:", error);
        throw error;
    }

    return (
        data ?? {
            branchesdata: {
                data: [],
                page: { page: 1, size: 20, total: 0 },
            },
        }
    );
};

export const DeleteBranch = async (branchesId: number): Promise<BranchesApiResponse> => {
    const { data, error } = await supabase.functions.invoke("delete-branches", {
        body: { branchesID: branchesId },
    });
    if (error) throw error;
    return data ?? [];
}

export const CreateBranch = async (branch: Branch): Promise<BranchesApiResponse> => {
    // Map to the specific payload structure expected by Deno (including typos)
    const payload = {
        name: branch.name,
        warehouseID: branch.warehouse,
        contryID: branch.countries, // Typo 'contryID' as per user request/code
        stateID: branch.states,
        cityID: branch.cities,
        neighborhoodsID: branch.neighborhoods,
        addres: branch.address || "",
        addresreferenc: branch.address_reference || "",
    };

    const { data, error } = await supabase.functions.invoke("create-branches", {
        method: "POST",
        body: payload,
    });
    if (error) throw error;
    return data ?? [];
}

export const UpdateBranch = async (branch: Branch): Promise<BranchesApiResponse> => {
    const { data, error } = await supabase.functions.invoke("update-branches", {
        method: "PUT",
        body: { branch },
    });
    if (error) throw error;
    return data ?? [];
}

export const WarehousesAPI = async (): Promise<IdNameResponse[]> => {
    const { data, error } = await supabase
        .from("warehouses")
        .select("id , name")
        .eq("is_active", true)
        .neq("id", 0)
    if (error) throw error;
    return data ?? [];
}

export const CountryApi = async (): Promise<IdNameResponse[]> => {
    const { data, error } = await supabase
        .from("countries")
        .select("id , name")
    if (error) throw error;
    return data ?? [];
}

export const StateApi = async (countryID: number): Promise<IdNameResponse[]> => {
    const { data, error } = await supabase
        .from("states")
        .select("id , name")
        .eq("country_id", countryID)
    if (error) throw error;
    return data ?? [];
}

export const CityApi = async (countryID: number, stateID: number): Promise<IdNameResponse[]> => {
    const { data, error } = await supabase
        .from("cities")
        .select("id,name")
        .eq("country_id", countryID)
        .eq("state_id", stateID)
    if (error) throw error;
    return data ?? [];
}

export const NeighborhoodApi = async (countryID: number, stateID: number, cityID: number): Promise<IdNameResponse[]> => {
    const { data, error } = await supabase
        .from("neighborhoods")
        .select("id,name")
        .eq("country_id", countryID)
        .eq("state_id", stateID)
        .eq("city_id", cityID)
    if (error) throw error;
    return data ?? [];
}
