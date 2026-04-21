import { supabase } from "@/integrations/supabase/client";
import { GetUserFunctionsResponse, SpGetUserViewsResponse, UserFunction } from "../types/layout.types";

export const getUserFunctionsApi = async (): Promise<GetUserFunctionsResponse> => {
    const { data, error } = await supabase.rpc("sp_get_user_views");

    if (error) {
        console.error("Error invoking sp_get_user_views:", error);
        throw error;
    }

    const sp = data as unknown as SpGetUserViewsResponse;

    return {
        success: true,
        session: {
            user: { id: sp.user_id, email: "" },
            role: sp.role?.role_name?.[0] ?? "",
            functions: sp.functions as unknown as UserFunction[],
            views: (sp.views ?? []).filter((v): v is string => v !== null),
        },
    };
};
