// CAMBIAR NOMBRES PORQUE SON POCO DESCRIPTIVOS, NO MENCIONAR INVENTORY EN NINGUNO
export interface WarehouseApiResponse {
  warehouse_id: number;
  warehouse_name: string;
  stock_type: string;
  stock?: number | null;
  stock_virtual?: number | null;
}
export interface InventoryApiResponse {
  data: Array<{
    sku: string;
    product_name: string;
    variation_id: number;
    variation_name: string;
    stock_by_warehouse: WarehouseApiResponse[];
    /** T-269 · Total global PRD en almacenes activos (definición única). */
    stock_global_prd?: number | null;
    /** T-269 · Lo decide la BD, no la suma en pantalla. */
    is_low_stock?: boolean | null;
  }>;
  page: {
    page: number;
    size: number;
    total: number;
    type_id: number;
  };
}

export interface Warehouse {
  id: number;
  name: string;
  stock_type?: string;
  stock?: number | null;
  stock_virtual?: number | null;
}

export interface Inventory {
  sku: string;
  product_name: string;
  variation_id: number;
  variation_name: string;
  stock_by_warehouse: Warehouse[];
  /**
   * T-269 · Total global de stock vendible (PRD) en almacenes activos.
   * OJO: no es la suma de `stock_by_warehouse`, que es local (solo los
   * almacenes filtrados) y usa stock virtual.
   */
  stock_global_prd: number;
  /** T-269 · Bajo el umbral global según la BD. */
  is_low_stock: boolean;
}

export interface InventoryFilters {
  page?: number;
  size?: number;
  search?: string | null;
  warehouse?: number | null;
  types?: number;
  order?: string | null;
  minstock?: number | null;
  maxstock?: number | null;
}

export interface InventoryPayload {
  product_variation_id: number;
  quantity: number | null;
  stock_type_id: number;
  movements_type_id: number;
  movement_type_code: string;
  warehouse_id: number;
}

export interface InventoryTypesApiResponse {
  types: Array<{ id: number; name: string; code: string }>;
}
export interface InventoryTypes {
  id: number;
  name: string;
  code: string;
}