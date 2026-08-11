import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/query";
import type { CreateBrandPayload, EditBrandPayload, GetBrandsResponse } from "@/modules/products/types/Brands.types";

interface GetBrandsParams {
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

export const getBrands = async (params: GetBrandsParams = {}): Promise<GetBrandsResponse> => {
  const endpoint = buildEndpoint("get-brands", params);
  const { data, error } = await supabase.functions.invoke<GetBrandsResponse>(endpoint);

  if (error) throw error;

  return data;
};

export const createBrand = async (payload: CreateBrandPayload) => {
  const { data, error } = await supabase.functions.invoke("create-brands", {
    body: payload,
  });

  if (error) throw new Error(await getFunctionErrorMessage(error));
  if (data?.error) throw new Error(data.error);

  return data;
};

export const deleteBrand = async (id: number) => {
  const { data, error } = await supabase.functions.invoke("delete-brands", {
    body: { id },
  });

  if (error) throw error;

  return data;
};

export const updateBrand = async (payload: EditBrandPayload) => {
  const { data, error } = await supabase.functions.invoke("update-brands", {
    body: payload,
  });

  if (error) throw new Error(await getFunctionErrorMessage(error));
  if (data?.error) throw new Error(data.error);

  return data;
};
