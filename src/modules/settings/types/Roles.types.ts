export interface RolesApiResponse {
    rolesdata: {
        data: Array<{
            id: number;
            name: string;
            users: number;
            is_admin: boolean
            functions: number
        }>;
        page: {
            page: number;
            size: number;
            total: number;
        }
    }
}

export interface Role {
    id: number;
    name: string;
    userCount: number;
    isAdmin: boolean
    functionCount: number
}

export interface RolesFilters {
    minuser?: number | null;
    maxuser?: number | null;
    is_admin?: boolean | null;
    search?: string | null;
    page?: number;
    size?: number;
}

//Usar en un futuro para no usar useEffect para sincronizar los filtros
export interface RolesFilterDraft {
    minuser?: number | null;
    maxuser?: number | null;
    is_admin?: boolean | null;
}

export interface RolePayload {
    id?: number;
    name: string;
    admin: boolean;
    functions: number[];
}