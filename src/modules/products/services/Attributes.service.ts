import { supabase } from "@/integrations/supabase/client";
import { AttributesApiResponse, AttributeFormValues, TermGroupOption } from "../types/Attributes.types";

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

export const createTermGroup = async (data: Omit<AttributeFormValues, "id">) => {
  const { data: result, error } = await supabase
    .from("term_groups")
    .insert({
      code: data.code,
      name: data.name,
      description: data.description || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating term group:", error);
    throw error;
  }

  return result;
};

// Obtener lista de term_groups para el selector
export const getTermGroupsForSelect = async (): Promise<TermGroupOption[]> => {
  const { data, error } = await supabase
    .from("term_groups")
    .select("id, code, name")
    .order("name");

  if (error) {
    console.error("Error fetching term groups:", error);
    throw error;
  }

  return data || [];
};

// Crear un nuevo término usando la edge function
export const createTerm = async (data: { 
  name: string; 
  term_group_id: number | null;
}) => {
  const { data: result, error } = await supabase.functions.invoke("create-terms", {
    method: "POST",
    body: {
      name: data.name,
      term_group_id: data.term_group_id,
    },
  });

  if (error) {
    console.error("Error creating term:", error);
    throw error;
  }

  return result;
};
