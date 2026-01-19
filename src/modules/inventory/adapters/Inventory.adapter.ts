import { PaginationState } from "@/shared/components/pagination/Pagination";
import { Inventory, InventoryApiResponse } from "../types/Inventory.types";

export const inventoryAdapter = (response: InventoryApiResponse) => {
  const formattedInventory: Inventory[] = response.data.map((item) => ({
    product_name: item.product_name,
    sku: item.sku,
    variation_id: item.variation_id,
    variation_name: item.variation_name,
    stock_by_warehouse: item.stock_by_warehouse.map((w) => ({
      id: w.warehouse_id,
      name: w.warehouse_name,
      stock_type: w.stock_type,
      stock: w.stock ?? null,
    })),
  }));

  const pagination: PaginationState = {
    p_page: response.page.page,
    p_size: response.page.size,
    total: response.page.total,
  };

  return { data: formattedInventory, pagination };
};
