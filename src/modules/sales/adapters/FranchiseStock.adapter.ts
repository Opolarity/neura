import { PaginationState } from "@/shared/components/pagination/Pagination";
import {
  FranchiseCategory,
  FranchiseStockApiResponse,
  FranchiseStockRow,
  FranchiseWarehouse,
} from "../types/FranchiseStock.types";

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Normaliza la respuesta de get-franchise-stock a la forma que consume la
 * pantalla. Un almacén sin fila en variation_stock llega sin `stock`: aquí se
 * resuelve a 0, que es lo que significa (no hay stock de ese SKU ahí).
 */
export const franchiseStockAdapter = (response: FranchiseStockApiResponse) => {
  const rows: FranchiseStockRow[] = (response?.data ?? []).map((item) => ({
    variationId: item.variation_id,
    sku: item.sku ?? "",
    productName: item.product_name ?? "",
    variationName: item.variation_name ?? "",
    stockTotal: toNumber(item.stock_total),
    stockByWarehouse: (item.stock_by_warehouse ?? []).map((w) => ({
      id: w.warehouse_id,
      name: w.warehouse_name ?? "",
      stock: toNumber(w.stock),
      stockVirtual: toNumber(w.stock_virtual),
    })),
  }));

  const warehouses: FranchiseWarehouse[] = (response?.warehouses ?? []).map(
    (w) => ({ id: w.id, name: w.name ?? "" }),
  );

  const categories: FranchiseCategory[] = (response?.categories ?? []).map(
    (c) => ({ id: c.id, name: c.name ?? "", parentId: c.parent_id ?? null }),
  );

  const pagination: PaginationState = {
    p_page: toNumber(response?.page?.page) || 1,
    p_size: toNumber(response?.page?.size) || 20,
    total: toNumber(response?.page?.total),
  };

  return { data: rows, warehouses, categories, pagination };
};
