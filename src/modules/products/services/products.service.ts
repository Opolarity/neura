import { supabase } from "@/integrations/supabase/client";
import { ProductApiResponse, ProductFilters } from "../products.types";

export const productsApi = async (
  filters: ProductFilters = {}
): Promise<ProductApiResponse> => {
  const activeFilters = Object.entries(filters).filter(
    ([_, value]) => value !== undefined && value !== null && value !== ""
  );

  let functionName = "get-products-list";

  // Construct query string for all parameters
  const queryParams = new URLSearchParams();
  activeFilters.forEach(([key, value]) => {
    queryParams.append(key, String(value));
  });

  const queryString = queryParams.toString();
  if (queryString) {
    functionName += `?${queryString}`;
  }

  const { data, error } = await supabase.functions.invoke(
    functionName,
    { method: "GET" }
  );

  if (error) {
    console.error("Invoke error:", error);
    throw error;
  }

  // Defensive: If data is a string, it might be unparsed JSON
  let result = data;
  if (typeof data === "string" && data.trim().startsWith("[")) {
    try {
      result = JSON.parse(data);
    } catch (e) {
      console.warn("Parsed response from string failed:", e);
    }
  }

  console.log("API response received structure keys:", result ? Object.keys(result) : "null");

  return result ?? { data: [], page: { page: 1, size: 20, total: 0 } };
};

export const getCategories = async () => {
  const { data, error } = await supabase.from("categories").select("id, name").order("name");
  if (error) throw error;
  return data;
};

export const deleteProducts = async (productIds: number[]) => {
  const { data, error } = await supabase.functions.invoke("delete-product", {
    body: { productIds },
  });

  if (error || !data.success) {
    throw new Error(data?.error || "Error al eliminar productos");
  }
};
