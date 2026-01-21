import { supabase } from "@/integrations/supabase/client";
import { AttributesApiResponse } from "../types/Attributes.types";

export interface GetAttributesParams {
  page?: number;
  size?: number;
  search?: string | null;
  min_pr?: number | null;
  max_pr?: number | null;
  group?: number | null;
}

export const getAttributesApi = async (
  params: GetAttributesParams = {}
): Promise<AttributesApiResponse> => {
  const queryParams = new URLSearchParams(
    Object.entries(params)
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== ""
      )
      .map(([key, value]) => [key, String(value)])
  );

  const endpoint = queryParams.toString()
    ? `get-terms?${queryParams.toString()}`
    : "get-terms";

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) {
    console.error("Invoke error:", error);
    throw error;
  }

  return (
    data ?? {
      page: { page: 1, size: 20, total: 0 },
      data: [],
    }
  );
};
