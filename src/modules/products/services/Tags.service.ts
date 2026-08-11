import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/query";
import type { CreateTagPayload, EditTagPayload, GetTagsResponse } from "@/modules/products/types/Tags.types";

interface GetTagsParams {
  page?: number;
  size?: number;
  search?: string;
}

// Las edge functions devuelven el mensaje de error en el body, pero supabase-js
// solo lo expone vía error.context (un Response) cuando el status es non-2xx.
const getFunctionErrorMessage = async (error: any): Promise<string> => {
  if (error?.context instanceof Response) {
    try {
      const body = await error.context.clone().json();
      if (body?.error) return body.error;
    } catch {
      // el body no era JSON, se usa el fallback de abajo
    }
  }
  return error?.message || "Error desconocido";
};

export const getTags = async (params: GetTagsParams = {}): Promise<GetTagsResponse> => {
  const endpoint = buildEndpoint("get-tags", params);
  const { data, error } = await supabase.functions.invoke<GetTagsResponse>(endpoint);

  if (error) throw error;

  return data;
};

export const createTag = async (payload: CreateTagPayload) => {
  const { data, error } = await supabase.functions.invoke("create-tags", {
    body: payload,
  });

  if (error) throw new Error(await getFunctionErrorMessage(error));
  if (data?.error) throw new Error(data.error);

  return data;
};

export const deleteTag = async (id: number) => {
  const { data, error } = await supabase.functions.invoke("delete-tags", {
    body: { id },
  });

  if (error) throw error;

  return data;
};

export const updateTag = async (payload: EditTagPayload) => {
  const { data, error } = await supabase.functions.invoke("update-tags", {
    body: payload,
  });

  if (error) throw new Error(await getFunctionErrorMessage(error));
  if (data?.error) throw new Error(data.error);

  return data;
};
