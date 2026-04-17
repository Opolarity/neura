import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/utils";
import {
  ProductApiResponse,
  ProductFilters,
  Categories,
} from "../types/Products.types";

export const productsApi = async (
  filters: ProductFilters = {},
): Promise<ProductApiResponse> => {
  const endpoint = buildEndpoint("get-products-list", filters);

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) {
    console.error("Invoke error:", error);
    throw error;
  }

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
  const { data, error } = await supabase.functions.invoke("delete-product", {
    body: { productId },
  });

  console.log(data);

  if (error || !data.success) {
    throw new Error(data?.error || "Error al eliminar producto");
  }
};

export const deleteProductsApi = async (productIds: number[]) => {
  const { data, error } = await supabase.functions.invoke(
    "delete-massive-products",
    {
      body: { productIds },
    },
  );

  if (error || !data.success) {
    throw new Error(data?.error || "Error al eliminar productos");
  }
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
