import { supabase } from "@/integrations/supabase/client";
import { OrderChannelTypesApiResponse, OrderChannelTypesFilters, CreateOrderChannelPayload } from "../types/OrderChannelTypes.types";

export const GetOrderChannelTypes = async (
    filters: OrderChannelTypesFilters
): Promise<OrderChannelTypesApiResponse> => {
    const queryParams = new URLSearchParams(
        Object.entries(filters)
            .filter(([, value]) => value !== undefined && value !== null && value !== "")
            .map(([key, value]) => [key, String(value)])
    );
    const endpoint = queryParams.toString()
        ? `get-order-chanel-types?${queryParams.toString()}`
        : "get-order-chanel-types";

    const { data, error } = await supabase.functions.invoke(endpoint, {
        method: "GET",
    });

    if (error) {
        console.error("Invoke error in GetOrderChannelTypes:", error);
        throw error;
    }

    // Ensure we handle the structure correctly, defaulting if missing
    return (
        data ?? {
            productsdata: {
                data: [],
                page: { page: 1, size: 20, total: 0 },
            }
        }
    );
};

export const CreateOrderChannelType = async (payload: CreateOrderChannelPayload): Promise<any> => {
    const { data, error } = await supabase.functions.invoke("create-order-chanel-type", {
        method: "POST",
        body: payload,
    });

    if (error) throw error;
    return data;
};

// Placeholder for now as we haven't seen update-order-chanel-type
export const UpdateOrderChannelType = async (payload: any): Promise<any> => {
    // Assuming update function might exist or be created later. 
    // If not found, this might need adjustment.
    // I'll leave it simple for now or commented out until verified.
    throw new Error("Update function not implemented yet");
};

export const GetModules = async (): Promise<{ id: number; name: string; code: string }[]> => {
    const { data, error } = await supabase
        .from("modules")
        .select("id, name, code")
        .order("name");

    if (error) throw error;
    return data ?? [];
};
