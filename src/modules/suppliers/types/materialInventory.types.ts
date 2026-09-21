import { PaginationState } from "@/shared/components/pagination/Pagination";

/**
 * Quién tiene el material. Es el filtro que justifica la pantalla: el saldo
 * total del material ya se ve en Almacén materiales, pero ahí lo mío y lo que
 * está en el taller son el mismo número, y son decisiones opuestas.
 *
 * En la base no hay tabla de almacenes de proveedor: es
 * `warehouses.supplier_id`, nulo para los míos.
 */
export type InventoryOwner = "all" | "mine" | "supplier";

/** Un almacén: una COLUMNA de la tabla. Las decide el backend con el filtro. */
export interface MaterialInventoryWarehouse {
  id: number;
  name: string;
  supplierId: number | null;
  supplierName: string | null;
  owner: "mine" | "supplier";
}

export interface MaterialInventoryApiResponse {
  inventorydata: {
    warehouses: Array<{
      id: number;
      name: string;
      supplier_id: number | null;
      supplier_name: string | null;
      owner: "mine" | "supplier";
    }>;
    data: Array<{
      material_id: number;
      material_name: string;
      measurement_unit: string | null;
      material_class_id: number | null;
      material_class_name: string | null;
      total_stock: number;
      stock_by_warehouse: Array<{ warehouse_id: number; stock: number }>;
    }>;
    page: { page: number; size: number; total: number };
  };
}

/** Una fila: un material, con su saldo en cada almacén. */
export interface MaterialInventoryRow {
  materialId: number;
  materialName: string;
  measurementUnit: string;
  materialClassId: number | null;
  materialClassName: string;
  totalStock: number;
  /** Por id de almacén. Los que no aparecen están en cero. */
  stockByWarehouse: Record<number, number>;
}

export interface MaterialInventoryFilters {
  page?: number;
  size?: number;
  search?: string | null;
  owner?: InventoryOwner;
  warehouse_id?: number | null;
  supplier_id?: number | null;
  material_id?: number | null;
  stock_type_id?: number | null;
  /** Contra el TOTAL del material, no contra el saldo de un almacén. */
  min_stock?: number | null;
  max_stock?: number | null;
  order?: string | null;
}

export interface MaterialInventoryResult {
  data: MaterialInventoryRow[];
  warehouses: MaterialInventoryWarehouse[];
  pagination: PaginationState;
}
