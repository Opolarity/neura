import { supabase } from "@/integrations/supabase/client";
import type {
  FetchCategoriesParams,
  CategoriesApiResponse,
} from "./CategorySelector.types";

export const fetchCategories = async (
  params: FetchCategoriesParams,
): Promise<CategoriesApiResponse> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("p_page", String(params.page));
  if (params.size) queryParams.set("p_size", String(params.size));
  if (params.search) queryParams.set("p_search", params.search);
  if (params.ids?.length) queryParams.set("p_ids", params.ids.join(","));

  const endpoint = queryParams.toString()
    ? `get-categories-selector?${queryParams.toString()}`
    : "get-categories-selector";

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;
  return data;
};
