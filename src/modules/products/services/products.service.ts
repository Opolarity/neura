import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/utils";
import {
  ProductApiResponse,
  ProductFilters,
  Categories,
} from "../types/Products.types";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";

export const productsApi = async (
  filters: ProductFilters = {},
): Promise<ProductApiResponse> => {
  // `category_ids` se arma a mano y solo si hay selección: buildEndpoint pasa
  // por cleanFilters, que hace String(value) y no descarta el arreglo vacío
  // (no es null ni ""), así que delegarlo emitiría un `category_ids=` vacío.
  const { category_ids, ...rest } = filters;
  const endpoint = buildEndpoint("get-products-list", {
    ...rest,
    ...(category_ids?.length ? { category_ids: category_ids.join(",") } : {}),
  });

  const data = await invokeFunction(endpoint, {
    method: "GET",
  });

  return (
    data ?? {
      productsdata: {
        data: [],
        page: { p_page: 1, p_size: 20, total: 0 },
      },
    }
  );
};

export const deleteProductApi = async (productId: number) => {
  await invokeFunction("delete-product", {
    body: { productId },
  });
};

export interface DeleteProductsResult {
  requested: number;
  deleted: number;
  deletedIds: number[];
  /** Ya estaban eliminados antes de esta llamada. */
  alreadyDeletedIds: number[];
  /** No existen en la base. */
  notFoundIds: number[];
}

export const deleteProductsApi = async (
  productIds: number[],
): Promise<DeleteProductsResult> => {
  const data = await invokeFunction(
    "delete-massive-products",
    {
      body: { productIds },
    },
  );

  return data as DeleteProductsResult;
};

// Resultado de las ediciones masivas que escriben directo en products.
export interface MassiveUpdateResult {
  updated: number;
  /** Productos borrados entre la selección y el guardado; no se tocaron. */
  skippedProductIds: number[];
}

// La selección se conserva entre páginas: un producto puede eliminarse
// (is_active = false) después de marcarlo. Solo se escribe en los activos y se
// devuelven los demás para avisar, igual que las edge functions de etiquetas y
// marcas. Si no queda ninguno, es un error: no hay nada que guardar.
const updateLiveProducts = async (
  productIds: number[],
  values: Record<string, string | null>,
): Promise<MassiveUpdateResult> => {
  const { data, error } = await supabase
    .from("products")
    .update(values)
    .in("id", productIds)
    .eq("is_active", true)
    .select("id");
  if (error) throw error;
  const updatedIds = new Set((data ?? []).map((p) => p.id));
  if (updatedIds.size === 0) {
    throw new Error("Ninguno de los productos seleccionados sigue activo");
  }
  return {
    updated: updatedIds.size,
    skippedProductIds: productIds.filter((id) => !updatedIds.has(id)),
  };
};

export const updatePromotionalTextApi = async (
  productIds: number[],
  promotionalText: string,
  promotionalBgColor: string,
  promotionalTextColor: string,
): Promise<MassiveUpdateResult> =>
  updateLiveProducts(productIds, {
    promotional_text: promotionalText,
    promotional_bg_color: promotionalBgColor,
    promotional_text_color: promotionalTextColor,
  });
export const updateSizeImagesApi = async (
  productIds: number[],
  sizesImageUrl: string | null,
  sizesRefImageUrl: string | null,
): Promise<MassiveUpdateResult> =>
  updateLiveProducts(productIds, {
    sizes_image_url: sizesImageUrl,
    sizes_ref_image_url: sizesRefImageUrl,
  });
export const categoriesApi = async (): Promise<Categories> => {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return data ?? [];
};
//Agregar la llamada de base de datos para este modal
export const updatePromotionalImageApi = async (
  productIds: number[],
  promotionalImgUrl: string | null,
): Promise<MassiveUpdateResult> =>
  updateLiveProducts(productIds, { promotional_img_url: promotionalImgUrl });

// Una URL vacía cuenta como "sin imagen", igual que en get_products_list.
export const countProductsWithPromotionalImageApi = async (
  productIds: number[],
): Promise<number> => {
  const { count, error } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .in("id", productIds)
    .not("promotional_img_url", "is", null)
    .neq("promotional_img_url", "");
  if (error) throw error;
  return count ?? 0;
};

// Solo toca los que tienen imagen, para poder decir cuántos cambiaron de
// verdad y cuántos se omitieron por no tenerla.
export const removePromotionalImageApi = async (
  productIds: number[],
): Promise<{ removed: number; skipped: number }> => {
  const { data, error } = await supabase
    .from("products")
    .update({ promotional_img_url: null })
    .in("id", productIds)
    .not("promotional_img_url", "is", null)
    .neq("promotional_img_url", "")
    .select("id");
  if (error) throw error;
  const removed = data?.length ?? 0;
  return { removed, skipped: productIds.length - removed };
};

export const updateLargeDescriptionApi = async (
  productIds: number[],
  description: string,
): Promise<MassiveUpdateResult> =>
  updateLiveProducts(productIds, { description: description });
export const updateShortDescriptionApi = async (
  productIds: number[],
  shortDescription: string,
): Promise<MassiveUpdateResult> =>
  updateLiveProducts(productIds, { short_description: shortDescription });
export const updateOtherDescriptionMinApi = async (
  productIds: number[],
  description: string,
): Promise<MassiveUpdateResult> =>
  updateLiveProducts(productIds, { other_description_min: description });
export const updateOtherDescriptionMayApi = async (
  productIds: number[],
  description: string,
): Promise<MassiveUpdateResult> =>
  updateLiveProducts(productIds, { other_description_may: description });
export const getChannelsApi = async (): Promise<
  { id: number; name: string; code: string }[]
> => {
  const { data, error } = await supabase
    .from("channels")
    .select("id, name, code")
    .order("name");

  if (error) throw error;
  return data ?? [];
};
export const updateSalesChannelsApi = async (
  productIds: number[],
  channelIds: number[],
): Promise<MassiveUpdateResult> => {
  // Solo productos activos: los eliminados después de seleccionarlos se
  // omiten y se devuelven para avisar (ver updateLiveProducts).
  const { data: liveRows, error: liveError } = await supabase
    .from("products")
    .select("id")
    .in("id", productIds)
    .eq("is_active", true);
  if (liveError) throw liveError;
  const liveIds = (liveRows ?? []).map((p) => p.id);
  if (liveIds.length === 0) {
    throw new Error("Ninguno de los productos seleccionados sigue activo");
  }
  const result: MassiveUpdateResult = {
    updated: liveIds.length,
    skippedProductIds: productIds.filter((id) => !liveIds.includes(id)),
  };

  // Elimina los canales actuales de los productos seleccionados
  const { error: deleteError } = await supabase
    .from("product_channels")
    .delete()
    .in("product_id", liveIds);
  if (deleteError) throw deleteError;
  // Inserta los nuevos canales para cada producto
  const rows = liveIds.flatMap((productId) =>
    channelIds.map((channelId) => ({
      product_id: productId,
      channel_id: channelId,
    })),
  );
  if (rows.length === 0) return result;
  const { error: insertError } = await supabase
    .from("product_channels")
    .insert(rows);
  if (insertError) throw insertError;
  return result;
};

// ================= Asignación masiva de etiquetas y marcas =================

export interface AssignTagsResult {
  created: number;
  skipped: number;
  requestedPairs: number;
  products: number;
  /** Productos borrados entre la selección y el guardado; no se tocaron. */
  skippedProductIds?: number[];
  tags: number;
}

// Asignación masiva aditiva: agrega las etiquetas a los productos y omite los
// pares que ya existen. Solo admite etiquetas (tags.type = 'tag'); la edge
// function rechaza cualquier id de marca, que vive en la misma tabla.
export const assignMassiveTagsApi = async (
  productIds: number[],
  tagIds: number[],
): Promise<AssignTagsResult> => {
  const data = await invokeFunction("assign-massive-tags", {
    body: { productIds, tagIds },
  });

  return data.data as AssignTagsResult;
};

export interface UnassignTagsResult {
  deleted: number;
  notFound: number;
  requestedPairs: number;
  products: number;
  /** Productos borrados entre la selección y el guardado; no se tocaron. */
  skippedProductIds?: number[];
  tags: number;
}

// Desasignación masiva: quita solo las etiquetas indicadas y deja intactas las
// demás del producto, incluida su marca. La lógica vive en la edge function.
export const unassignMassiveTagsApi = async (
  productIds: number[],
  tagIds: number[],
): Promise<UnassignTagsResult> => {
  const data = await invokeFunction("unassign-massive-tags", {
    body: { productIds, tagIds },
  });

  return data.data as UnassignTagsResult;
};

export type MassiveBrandsMode = "assign" | "unassign";

export interface AssignBrandsResult {
  mode: MassiveBrandsMode;
  created: number;
  skipped: number;
  removed: number;
  requestedPairs: number;
  products: number;
  /** Productos borrados entre la selección y el guardado; no se tocaron. */
  skippedProductIds?: number[];
  brands: number;
}

// Asignación/desasignación masiva acotada: 'assign' agrega las marcas indicadas
// omitiendo las que ya existen y 'unassign' quita solo esas marcas, dejando el
// resto intacto. Solo admite marcas (tags.type = 'brand'); la edge function
// rechaza cualquier id de etiqueta, que vive en la misma tabla product_tags.
export const assignMassiveBrandsApi = async (
  productIds: number[],
  brandIds: number[],
  mode: MassiveBrandsMode,
): Promise<AssignBrandsResult> => {
  const data = await invokeFunction("assign-massive-brands", {
    body: { productIds, brandIds, mode },
  });

  return data.data as AssignBrandsResult;
};
