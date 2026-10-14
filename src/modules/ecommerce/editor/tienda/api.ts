/**
 * Las cuatro lecturas de catálogo que usan los bloques y los pickers del editor,
 * con la misma firma y la misma forma de respuesta que `lib/api.ts` de
 * ecommerce-overtake (develop), para que los bloques no cambien.
 *
 * Como en la tienda, las funciones de productos identifican el canal por
 * `x-channel-code`: aquí es el código del canal elegido en el editor (la tienda
 * usa NEXT_PUBLIC_CHANNEL_CODE). Las categorías se leen por REST.
 */
import { supabase } from "@/integrations/supabase/client";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import { editorChannelHeaders } from "@/modules/ecommerce/editor/lib/editor-channel";
import type {
  CategoryGridResponse,
  CategoryResponse,
  EdgeCategory,
  EdgeProductListResponse,
  ProductGridFilters,
  ProductGridResponse,
} from "@/modules/ecommerce/editor/tienda/types";

// Igual que en la tienda: las llamadas idénticas en vuelo comparten promesa
// (varios bloques de productos piden lo mismo en el mismo tick). No es caché.
const inFlightRequests = new Map<string, Promise<unknown>>();

function dedupeInFlight<T>(key: string, run: () => Promise<T>): Promise<T> {
  const pending = inFlightRequests.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const promise = run().finally(() => {
    inFlightRequests.delete(key);
  });

  inFlightRequests.set(key, promise);
  return promise;
}

export async function getCategories(): Promise<CategoryResponse> {
  return dedupeInFlight("categories", async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, image_url, description, parent_category");

    if (error) {
      console.error("Error fetching categories:", error);
      return { success: false, data: [] };
    }

    return { success: true, data: data as unknown as EdgeCategory[] };
  });
}

export async function getProductList(
  categoryId?: number,
  size: number = 10,
  page: number = 1,
  search?: string,
  salePrice?: boolean,
  order?: string,
  termId?: number,
  cartSubtotal?: number,
): Promise<EdgeProductListResponse> {
  let url = `ec-get-product-list?size=${size}&page=${page}`;

  if (categoryId !== undefined && categoryId !== null) url += `&category_id=${categoryId}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (salePrice) url += `&sale_price=true`;
  if (order) url += `&order=${order}`;
  if (termId) url += `&term_id=${termId}`;
  if (cartSubtotal !== undefined && cartSubtotal > 0) url += `&cart_subtotal=${cartSubtotal}`;

  try {
    return await invokeFunction<EdgeProductListResponse>(url, {
      headers: editorChannelHeaders(),
    });
  } catch (error) {
    console.error("Error fetching product list:", error);
    return { success: false, data: [] } as unknown as EdgeProductListResponse;
  }
}

export async function getProductGrid(
  filters: ProductGridFilters,
): Promise<ProductGridResponse> {
  const body = {
    search: filters.search ?? null,
    category_id: filters.category_id ?? null,
    category_ids: filters.category_ids ?? null,
    size: filters.size ?? null,
    sale_price: filters.sale_price ?? false,
    order: filters.order ?? null,
    product_ids: filters.product_ids ?? [],
    brand_id: filters.brand_id ?? null,
    source: filters.source ?? null,
  };

  return dedupeInFlight(`product-grid:${JSON.stringify(body)}`, async () => {
    try {
      const data = await invokeFunction<any>("ec-get-product-ids", {
        method: "POST",
        body,
        headers: editorChannelHeaders(),
      });
      return { success: true, data: { data: data?.data?.data ?? [] } };
    } catch (error) {
      console.error("Error fetching product grid:", error);
      return { success: false, data: { data: [] } };
    }
  });
}

export async function getCategoryGrid(
  ids: number[] = [],
): Promise<CategoryGridResponse> {
  try {
    const data = await invokeFunction<any>("ec-get-categories-ids", {
      method: "POST",
      body: { categories_ids: ids ?? [] },
    });
    return { success: true, data: data?.data ?? [] };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { success: false, data: [] };
  }
}
