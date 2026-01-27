import { supabase } from "@/integrations/supabase/client";
import { RolesApiResponse, RolesFilters, RolePayload } from "../types/Roles.types";

export const rolesApi = async (
    filters: RolesFilters
): Promise<RolesApiResponse> => {

    const queryParams = new URLSearchParams(
        Object.entries(filters)
            .filter(([, value]) => value !== undefined && value !== null && value !== "")
            .map(([key, value]) => [key, String(value)])
    );

    const endpoint = queryParams.toString()
        ? `get-roles?${queryParams.toString()}`
        : "get-roles";

    const { data, error } = await supabase.functions.invoke(endpoint, {
        method: "GET",
    });


    if (error) {
        console.error("Invoke error in rolesApi:", error);
        throw error;
    }

    return (
        data ?? {
            rolesdata: {
                data: [],
                page: { page: 1, size: 20, total: 0 },
            },
        }
    );
};

export const deleteRoleApi = async (roleId: number) => {
    const { data, error } = await supabase.functions.invoke("delete-role", {
        body: { id: roleId },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
}

export const createRoleApi = async (newRole: RolePayload) => {
    const { data, error } = await supabase.functions.invoke("create-role", {
        method: "POST",
        body: newRole
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
}

export const updateRoleApi = async (updateRole: RolePayload) => {
    const { data, error } = await supabase.functions.invoke("update-role", {
        body: updateRole
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
}