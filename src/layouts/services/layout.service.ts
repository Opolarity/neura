import { supabase } from "@/integrations/supabase/client";
import { GetUserFunctionsResponse } from "../types/layout.types";

/**
 * Fetches the current user's role and allowed functions from the Supabase Edge Function.
 * This function integrates with the 'get-user-functions' edge function which
 * internally calls the 'get_user_role_and_functions' RPC.
 */
export const getUserFunctionsApi = async (): Promise<GetUserFunctionsResponse> => {
    const { data, error } = await supabase.functions.invoke("get-user-functions", {
        method: "GET",
    });

    if (error) {
        console.error("Error invoking get-user-functions:", error);
        throw error;
    }

    if (data?.error) {
        console.error("Edge function error:", data.error);
        throw new Error(data.error);
    }

    return data as GetUserFunctionsResponse;
};
