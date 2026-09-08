import { buildEndpoint } from "@/shared/utils/utils";
import {
  RoleDetailApiResponse,
  RolesApiResponse,
  RolesFilters,
  RolePayload,
} from "../types/Roles.types";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";

export const rolesApi = async (
  filters: RolesFilters,
): Promise<RolesApiResponse> => {
  const endpoint = buildEndpoint("get-roles", filters);

  const data = await invokeFunction(endpoint, {
    method: "GET",
  });

  return (
    data ?? {
      rolesdata: {
        data: [],
        page: { page: 1, size: 20, total: 0 },
      },
    }
  );
};

export const roleDetailApi = async (
  roleId: number,
): Promise<RoleDetailApiResponse> => {
  const data = await invokeFunction("get-role-details", {
    body: { roleId },
  });

  return data;
};

export const deleteRoleApi = async (roleId: number) => {
  await invokeFunction("delete-role", {
    body: { id: roleId },
  });
};

export const createRoleApi = async (newRole: RolePayload) => {
  await invokeFunction("create-role", {
    method: "POST",
    body: newRole,
  });
};

export const updateRoleApi = async (updateRole: RolePayload) => {
  await invokeFunction("update-role", {
    body: updateRole,
  });
};
