import { supabase } from "@/integrations/supabase/client";
import { PaymentMethodsApiResponse, PaymentMethodsFilters } from "../types/PaymentMethods.types";

export const PaymentMethodsApi = async (
    filters: PaymentMethodsFilters
): Promise<PaymentMethodsApiResponse> => {
    const queryParams = new URLSearchParams(
        Object.entries(filters)
            .filter(([, value]) => value !== undefined && value !== null && value !== "")
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .map(([key, value]) => [key, String(value)])
    );
    const endpoint = queryParams.toString()
        ? `get-payments-methods?${queryParams.toString()}`
        : "get-payments-methods";
    const { data, error } = await supabase.functions.invoke(endpoint, {
        method: "GET",
    });

    if (error) {
        console.error("Invoke error in PaymentMethodsApi:", error);
        throw error;
    }

    return (
        data ?? {
            data: [],
            page: { page: 1, size: 20, total: 0 },
        }
    );
};
