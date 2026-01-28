import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/utils";
import { AttributesApiResponse, AttributeFormValues, TermFormValues, TermGroupOption } from "../types/Attributes.types";

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
  const endpoint = buildEndpoint("get-terms", params);

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

// Obtener datos de un term_group para edición
export const getTermGroupById = async (id: number): Promise<AttributeFormValues> => {
  const { data, error } = await supabase
    .from("term_groups")
    .select("id, code, name, description")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching term group:", error);
    throw error;
  }

  return data;
};

// Actualizar un term_group
export const updateTermGroup = async (data: AttributeFormValues) => {
  if (!data.id) throw new Error("ID is required for update");

  const { data: result, error } = await supabase
    .from("term_groups")
    .update({
      code: data.code,
      name: data.name,
      description: data.description || null,
    })
    .eq("id", data.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating term group:", error);
    throw error;
  }

  return result;
};

// Obtener lista de term_groups para el selector
export const getTermGroupsForSelect = async (): Promise<TermGroupOption[]> => {
  const { data, error } = await supabase
    .from("term_groups")
    .select("id, code, name")
    .eq("is_active", true)
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

// Obtener datos de un término para edición
export const getTermById = async (id: number): Promise<TermFormValues> => {
  const { data, error } = await supabase
    .from("terms")
    .select("id, name, term_group_id")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching term:", error);
    throw error;
  }

  return data;
};

// Actualizar un término usando la edge function
export const updateTerm = async (data: TermFormValues) => {
  if (!data.id) throw new Error("ID is required for update");

  const { data: result, error } = await supabase.functions.invoke("update-terms", {
    method: "POST",
    body: {
      id: data.id,
      name: data.name,
      term_group_id: data.term_group_id,
    },
  });

  if (error) {
    console.error("Error updating term:", error);
    throw error;
  }

  return result;
};

// Eliminar un término (soft delete)
export const deleteTerm = async (id: number) => {
  const { data, error } = await supabase.functions.invoke("delete-terms", {
    method: "POST",
    body: { termsId: id },
  });

  if (error) {
    console.error("Error deleting term:", error);
    throw error;
  }

  return data;
};

// Eliminar un term_group y todos sus términos (soft delete)
export const deleteTermGroup = async (id: number) => {
  const { data, error } = await supabase.functions.invoke("delete-term-group", {
    method: "POST",
    body: { id },
  });

  if (error) {
    console.error("Error deleting term group:", error);
    throw error;
  }

  return data;
};
