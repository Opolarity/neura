import { supabase } from "@/integrations/supabase/client";

export const get = async () => {
  const { data, error } = await supabase.functions.invoke("get-products-list");
  if (error) throw error;
  return data?.products ?? [];
};

export const deleteProducts = async (productIds: number[]) => {
  const { data, error } = await supabase.functions.invoke("delete-product", {
    body: { productIds },
  });

  if (error || !data.success) {
    throw new Error(data?.error || "Error al eliminar productos");
  }
};

// === CATEGORIES ===
export const getCategories = async () => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .neq("id", 0);
  if (error) throw error;
  return data ?? [];
};

export const getCategoryProductCounts = async (): Promise<Record<number, number>> => {
  const { data, error } = await supabase.functions.invoke("get-categories-product-count");
  if (error) throw error;

  const countsMap: Record<number, number> = {};
  data?.forEach((item: { category_id: number; product_count: number }) => {
    countsMap[item.category_id] = item.product_count;
  });
  return countsMap;
};

export const createCategory = async (name: string, description: string | null, imageUrl: string | null) => {
  const { error } = await supabase
    .from("categories")
    .insert([{ name, description, image_url: imageUrl }]);
  if (error) throw error;
};

export const updateCategory = async (id: number, name: string, description: string | null, imageUrl: string | null) => {
  const { error } = await supabase
    .from("categories")
    .update({ name, description, image_url: imageUrl })
    .eq("id", id);
  if (error) throw error;
};

export const deleteCategory = async (categoryId: number) => {
  const { data, error } = await supabase.functions.invoke("delete-category", {
    body: { categoryId },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
};

export const uploadCategoryImage = async (file: File): Promise<string> => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random()}.${fileExt}`;

  const { error } = await supabase.storage.from("products").upload(fileName, file);
  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(fileName);
  return publicUrl;
};
