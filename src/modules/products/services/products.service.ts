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

export const deleteProductsApi = async (productIds: number[]) => {
  await invokeFunction(
    "delete-massive-products",
    {
      body: { productIds },
    },
  );
};

export const updatePromotionalTextApi = async (
  productIds: number[],
  promotionalText: string,
  promotionalBgColor: string,
  promotionalTextColor: string,
) => {
  const { error } = await supabase
    .from("products")
    .update({
      promotional_text: promotionalText,
      promotional_bg_color: promotionalBgColor,
      promotional_text_color: promotionalTextColor,
    })
    .in("id", productIds);

  if (error) throw error;
};
export const updateSizeImagesApi = async (
  productIds: number[],
  sizesImageUrl: string | null,
  sizesRefImageUrl: string | null,
) => {
  const { error } = await supabase
    .from("products")
    .update({
      sizes_image_url: sizesImageUrl,
      sizes_ref_image_url: sizesRefImageUrl,
    })
    .in("id", productIds);

  if (error) throw error;
};
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
) => {
  const { error } = await supabase
    .from("products")
    .update({ promotional_img_url: promotionalImgUrl } )
    .in("id", productIds);
  if (error) throw error;
};

export const updateLargeDescriptionApi = async (
  productIds: number[],
  description: string,
) => {
  const { error } = await supabase
    .from("products")
    .update({ description: description })
    .in("id", productIds);
  if (error) throw error;
};
export const updateShortDescriptionApi = async (
  productIds: number[],
  shortDescription: string,
) => {
  const { error } = await supabase
    .from("products")
    .update({ short_description: shortDescription })
    .in("id", productIds);
  if (error) throw error;
};
export const updateOtherDescriptionMinApi = async (
  productIds: number[],
  description: string,
) => {
  const { error } = await supabase
    .from("products")
    .update({ other_description_min: description })
    .in("id", productIds);
  if (error) throw error;
};
export const updateOtherDescriptionMayApi = async (
  productIds: number[],
  description: string,
) => {
  const { error } = await supabase
    .from("products")
    .update({ other_description_may: description })
    .in("id", productIds);
  if (error) throw error;
};
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
) => {
  // Elimina los canales actuales de los productos seleccionados
  const { error: deleteError } = await supabase
    .from("product_channels")
    .delete()
    .in("product_id", productIds);
  if (deleteError) throw deleteError;
  // Inserta los nuevos canales para cada producto
  const rows = productIds.flatMap((productId) =>
    channelIds.map((channelId) => ({
      product_id: productId,
      channel_id: channelId,
    })),
  );
  if (rows.length === 0) return;
  const { error: insertError } = await supabase
    .from("product_channels")
    .insert(rows);
  if (insertError) throw insertError;
};

// ================= Asignación masiva de etiquetas y marcas =================

export interface AssignTagsResult {
  created: number;
  skipped: number;
  requestedPairs: number;
  products: number;
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
