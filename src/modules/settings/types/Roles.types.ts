export interface RolesApiResponse {
  rolesdata: {
    data: Array<{
      id: number;
      name: string;
      users: number;
      is_admin: boolean;
      permissions: number;
      capabilities: number;
      /**
       * Alias transitorio que sp_get_roles mantiene con el mismo valor que
       * `permissions`, para cubrir la ventana entre aplicar la migración y
       * desplegar este build. Eliminable después.
       */
      functions?: number;
    }>;
    page: {
      page: number;
      size: number;
      total: number;
    };
  };
}

export interface Role {
  id: number;
  name: string;
  userCount: number;
  isAdmin: boolean;
  permissionCount: number;
  capabilityCount: number;
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
  /** ids de `permissions` con type = 'route' */
  permissions: number[];
  /** ids de `permissions` con type = 'component' */
  capabilities: number[];
}

export interface RoleDetailApiResponse {
  role: {
    id: number;
    name: string;
    admin: boolean;
  };
  permissionIds: number[];
  capabilityIds: number[];
}

export interface RoleDetail {
  id: number;
  name: string;
  admin: boolean;
  permissions: number[];
  capabilities: number[];
}
