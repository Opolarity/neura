import {
  MaterialInventoryApiResponse,
  MaterialInventoryResult,
} from "../types/materialInventory.types";

/**
 * Respuesta de get-material-inventory → modelo de la tabla.
 *
 * El saldo puede ser NEGATIVO a propósito: `material_stock` lo admite desde la
 * 202610010103, y un negativo es el faltante que queda por comprar. Aquí no se
 * recorta a cero -- taparlo sería esconder justo lo que hay que ver.
 */
export const materialInventoryAdapter = (
  response: MaterialInventoryApiResponse,
): MaterialInventoryResult => {
  const raw = response?.inventorydata ?? {
    warehouses: [],
    data: [],
    page: { page: 1, size: 20, total: 0 },
  };

  return {
    warehouses: (raw.warehouses ?? []).map((warehouse) => ({
      id: Number(warehouse.id),
      name: warehouse.name ?? "",
      supplierId: warehouse.supplier_id ?? null,
      supplierName: warehouse.supplier_name ?? null,
      owner: warehouse.owner === "supplier" ? "supplier" : "mine",
    })),
    data: (raw.data ?? []).map((row) => {
      // Un mapa y no el array: la tabla lo lee una vez por columna y por fila,
      // y buscar en un array en cada celda es recorrerlo entero cada vez.
      const stockByWarehouse: Record<number, number> = {};
      (row.stock_by_warehouse ?? []).forEach((entry) => {
        stockByWarehouse[Number(entry.warehouse_id)] = Number(entry.stock ?? 0);
      });

      return {
        materialId: Number(row.material_id),
        materialName: row.material_name ?? "",
        measurementUnit: row.measurement_unit ?? "",
        materialClassId: row.material_class_id ?? null,
        materialClassName: row.material_class_name ?? "",
        totalStock: Number(row.total_stock ?? 0),
        stockByWarehouse,
      };
    }),
    pagination: {
      p_page: raw.page?.page ?? 1,
      p_size: raw.page?.size ?? 20,
      total: raw.page?.total ?? 0,
    },
  };
};
