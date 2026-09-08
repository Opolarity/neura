// Tipos de la pantalla "Stock de franquicias" (/stock/products/franchise).
//
// El dato no sale de la BD de este ERP: viene del backend de franquiciados a
// través de la edge function get-franchise-stock, que hace de puente. Por eso
// los almacenes llegan dentro de la respuesta (son los del franquiciado, no los
// nuestros) en vez de leerse con getWarehousesIsActiveTrue.

/**
 * Franquiciado del selector, tal como lo devuelve get-franchise-tenants (una
 * fila de `tenants` del otro backend).
 *
 * No se usa FranchiseeAccount (accounts con tenant_reference) porque esa tabla
 * guarda al franquiciado como cliente de Overtake — "GARB CORP SAC" — y no por
 * su nombre comercial. Aquel tipo sigue vivo para las promociones de
 * consignación, donde lo que hace falta es justamente la cuenta.
 */
export interface FranchiseeTenant {
  id: number;
  /** Lo que en este ERP se guarda como accounts.tenant_reference. */
  code: string;
  /** Nombre comercial: "Bultiger Club", "Bunker Clothing". */
  name: string;
}

/** Categoría del franquiciado; el árbol cambia con cada franquiciado. */
export interface FranchiseCategory {
  id: number;
  name: string;
  /** null = categoría raíz. Filtrar por una incluye a sus descendientes. */
  parentId: number | null;
}

/** Almacén del franquiciado; cada uno es una columna de la tabla. */
export interface FranchiseWarehouse {
  id: number;
  name: string;
}

export interface FranchiseStockByWarehouse {
  id: number;
  name: string;
  /** Stock físico: lo que hay en el almacén (variation_stock, tipo PRD). */
  stock: number;
  /** Físico menos los movimientos de salida pendientes de completar. */
  stockVirtual: number;
}

export interface FranchiseStockRow {
  variationId: number;
  sku: string;
  productName: string;
  variationName: string;
  /** Lo calcula el SP sumando los almacenes; es el valor por el que ordena. */
  stockTotal: number;
  stockByWarehouse: FranchiseStockByWarehouse[];
}

export interface FranchiseStockFilters {
  page?: number;
  size?: number;
  search?: string | null;
  order?: string | null;
  minstock?: number | null;
  maxstock?: number | null;
  /** Ids de categoría del franquiciado; viajan como CSV en el query string. */
  categories?: number[] | null;
}

// ── Forma cruda que devuelve la edge function (snake_case) ──────────────────

export interface FranchiseStockApiResponse {
  data: Array<{
    variation_id: number;
    sku: string | null;
    product_name: string | null;
    variation_name: string | null;
    stock_total?: number | null;
    stock_by_warehouse: Array<{
      warehouse_id: number;
      warehouse_name: string | null;
      stock?: number | null;
      stock_virtual?: number | null;
    }>;
  }>;
  warehouses: Array<{ id: number; name: string | null }>;
  categories?: Array<{ id: number; name: string | null; parent_id: number | null }>;
  page: {
    page: number;
    size: number;
    total: number;
    type_id?: number;
  };
}
