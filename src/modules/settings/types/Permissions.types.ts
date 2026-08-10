/**
 * Catálogo de permisos — fuente de verdad: tabla `permissions` del backend.
 *
 * La jerarquía sale de `parentId` (autorreferencia de la tabla). El frontend
 * NO aporta agrupación: no se cruza nada con APP_PERMISSIONS_CONFIG.
 */
export type PermissionType = "route" | "component";

/** Fila cruda que devuelve la edge function `get-permissions`. */
export interface PermissionCatalogApiItem {
  id: number;
  code: string;
  name: string;
  type: PermissionType;
  parent_id: number | null;
}

export interface PermissionsCatalogApiResponse {
  permissions: PermissionCatalogApiItem[];
}

/** Ítem ya normalizado. */
export interface PermissionCatalogItem {
  id: number;
  code: string;
  name: string;
  type: PermissionType;
  parentId: number | null;
}

/** Nodo del árbol que renderiza PermissionTreeSelector. */
export interface PermissionNode {
  id: number;
  code: string;
  name: string;
  children: PermissionNode[];
}

export interface PermissionTree {
  permissions: PermissionNode[];
  allPermissionIds: number[];
  /** id → id del padre efectivo (null si es raíz). Alimenta la cascada hacia arriba. */
  parentOf: Map<number, number | null>;
  /** id → todos sus descendientes. Alimenta la cascada hacia abajo. */
  descendantsOf: Map<number, number[]>;
}
