import { PaginationState } from "@/shared/components/pagination/Pagination";
import {
    Role,
    RoleDetail,
    RoleDetailApiResponse,
    RolesApiResponse,
} from "../types/Roles.types";

export const rolesAdapter = (response: RolesApiResponse) => {
    const formattedRoles: Role[] = response.rolesdata.data.map(
        (item) => ({
            id: item.id,
            name: item.name,
            userCount: item.users,
            isAdmin: item.is_admin,
            permissionCount: item.permissions ?? 0,
        })
    );

    const pagination: PaginationState = {
        p_page: response.rolesdata.page.page,
        p_size: response.rolesdata.page.size,
        total: response.rolesdata.page.total,
    };

    return { data: formattedRoles, pagination };
};

export const roleDetailAdapter = (
    response: RoleDetailApiResponse
): RoleDetail => ({
    id: response.role.id,
    name: response.role.name,
    admin: response.role.admin,
    permissions: response.permissionIds ?? [],
});
