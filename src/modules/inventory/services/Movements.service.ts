import { supabase } from "@/integrations/supabase/client";
import { MovementsApiResponse, MovementsFilters, MovementsTypesApiResponse, SimpleUsers, SimpleWarehouses } from "../types/Movements.types";

export const getStockMovementsApi = async (
    filters: MovementsFilters = {}
): Promise<MovementsApiResponse> => {
    const queryParams = new URLSearchParams(
        Object.entries(filters)
            .filter(([, value]) => value !== undefined && value !== null && value !== "")
            .map(([key, value]) => [key, String(value)])
    );

    const endpoint = queryParams.toString()
        ? `get-stock-movements?${queryParams.toString()}`
        : "get-stock-movements";

    //const endpoint = "get-stock-movements?page=1&size=20&start_date=2026-01-19&end_date=2026-01-19"

    //const endpoint = "get-stock-movements?page=1"

    const { data, error } = await supabase.functions.invoke(endpoint);

    if (error) {
        console.error("Invoke error:", error);
        throw error;
    }

    return (
        data ?? {
            movementsstock: {
                data: [],
                page: { page: 1, size: 20, total: 0 },
            },
        }
    );
};

export const movementsTypesApi = async (): Promise<
    MovementsTypesApiResponse[]
> => {
    const { data, error } = await supabase
        .from("modules")
        .select("types(id,name,code)")
        .eq("code", "STM")
        .order("name");
    if (error) throw error;
    return data ?? [];
};

export const warehousesListApi = async (): Promise<SimpleWarehouses[]> => {
    const { data, error } = await supabase
        .from("warehouses")
        .select("id, name")
        .order("name");
    if (error) throw error;
    return data ?? [];
};

export const usersListApi = async (): Promise<SimpleUsers[]> => {
    const { data, error } = await supabase
        .from("accounts")
        .select("id, name")
        .order("name");
    if (error) throw error;
    return data ?? [];
};
