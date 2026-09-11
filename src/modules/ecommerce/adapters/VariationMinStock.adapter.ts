import type { PaginationState } from "@/modules/products/types/Products.types";
import type {
  VariationMinStock,
  VariationsMinStockApiResponse,
} from "../types/MinimumStock.types";

export const variationsMinStockAdapter = (
  response: VariationsMinStockApiResponse,
) => {
  const variations: VariationMinStock[] = (response?.data ?? []).map((row) => ({
    variationId: row.variation_id,
    sku: row.sku,
    productId: row.product_id,
    productName: row.product_name,
    terms: row.terms,
    stock: Number(row.stock ?? 0),
    // null se conserva: es "sin fila propia", que no es lo mismo que 0.
    minStock: row.min_stock === null || row.min_stock === undefined
      ? null
      : Number(row.min_stock),
    estado: row.estado,
    web: row.web,
  }));

  const pagination: PaginationState = {
    p_page: response?.page?.p_page ?? 1,
    p_size: response?.page?.p_size ?? 20,
    total: response?.page?.total ?? 0,
  };

  const defaultMinStock =
    response?.default_min_stock === null ||
    response?.default_min_stock === undefined
      ? null
      : Number(response.default_min_stock);

  return { variations, pagination, defaultMinStock };
};
