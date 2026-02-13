import { supabase } from "@/integrations/supabase/client";
import { StockTypesApiResponse, StockTypesFilters } from "../types/StockTypes.types";

export const GetStockTypes = async (
    filters: StockTypesFilters
): Promise<StockTypesApiResponse> => {
    const queryParams = new URLSearchParams(
        Object.entries(filters)
            .filter(([, value]) => value !== undefined && value !== null && value !== "")
            .map(([key, value]) => [key, String(value)])
    );
    const endpoint = queryParams.toString()
        ? `get-stock-types?${queryParams.toString()}`
        : "get-stock-types";

    const { data, error } = await supabase.functions.invoke(endpoint, {
        method: "GET",
    });

    if (error) {
        console.error("Invoke error in GetStockTypes:", error);
        throw error;
    }

    return (
        data ?? {
            data: [],
            page: { page: 1, size: 20, total: 0 },
        }
    );
};
