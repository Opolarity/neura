import { supabase } from "@/integrations/supabase/client";
import {
  ProductApiResponse,
  ProductFilters,
  Categories,
} from "../types/Products.types";

export const productsApi = async (
  filters: ProductFilters = {}
): Promise<ProductApiResponse> => {

  const queryParams = new URLSearchParams(
    Object.entries(filters)
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== ""
      )
      .map(([key, value]) => [key, String(value)])
  );

  const endpoint = queryParams.toString()
    ? `get-products-list?${queryParams.toString()}`
    : "get-products-list";

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
    }
  );

  if (error || !data.success) {
    throw new Error(data?.error || "Error al eliminar productos");
  }
};

export const categoriesApi = async (): Promise<Categories> => {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return data ?? [];
};
