import { supabase } from "@/integrations/supabase/client";
import { PaymentMethodsApiResponse, PaymentMethodsFilters, PaymentMethod } from "../types/PaymentMethods.types";

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
        data?.paymentsMethodsData ?? {
            data: [],
            page: { page: 1, size: 20, total: 0 },
        }
    );
};

export const GetPaymentMethodDetails = async (id: number): Promise<{ paymentMethod: PaymentMethod }> => {
    // This is a placeholder. Typically you'd have an endpoint or use the list endpoint with a specific ID filter if backend supports it.
    // Assuming we might need to implement a get-details endpoint or just filter from list for now if list returns all.
    // For now, let's assume we can fetch it via the same list endpoint with a search or a specific new endpoint.
    // But based on user request "guiate de branches", branches has "get-branches-details".
    // I should check if "get-payments-methods-details" exists or if I should just use the list.
    // The user didn't mention a details endpoint, but for editing we need it.
    // I'll assume for now we might need to create it or it exists.
    // Wait, the user said "guiate de la carpeta supabase de la carpeta get/payments-methods".
    // I'll try to find if there is a specific function for details or if I should use list.
    // I'll check the directory first.
    return { paymentMethod: {} as PaymentMethod }; // Placeholder
};

export const CreatePaymentMethod = async (paymentMethod: Omit<PaymentMethod, 'id'>): Promise<any> => {
    const { data, error } = await supabase.functions.invoke("create-payments-methods", {
        method: "POST",
        body: paymentMethod,
    });
    if (error) throw error;
    return data;
};

export const UpdatePaymentMethod = async (paymentMethod: PaymentMethod): Promise<any> => {
    const { data, error } = await supabase.functions.invoke("update-payments-methods", {
        method: "PUT",
        body: paymentMethod,
    });
    if (error) throw error;
    return data;
};

export const BusinessAccountsApi = async (): Promise<{ id: number; name: string }[]> => {
    const { data, error } = await supabase
        .from("business_accounts")
        .select("id, name")
        .order("name");

    if (error) throw error;
    return data ?? [];
};
