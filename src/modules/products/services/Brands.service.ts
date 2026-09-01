import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/query";
import type { CreateBrandPayload, EditBrandPayload, GetBrandsResponse } from "@/modules/products/types/Brands.types";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";

interface GetBrandsParams {
  page?: number;
  size?: number;
  search?: string;
}

export const getBrands = async (params: GetBrandsParams = {}): Promise<GetBrandsResponse> => {
  const endpoint = buildEndpoint("get-brands", params);
  const data = await invokeFunction<GetBrandsResponse>(endpoint);

  return data;
};

export const createBrand = async (payload: CreateBrandPayload) => {
  const data = await invokeFunction("create-brands", {
    body: payload,
  });

  return data;
};

export const deleteBrand = async (id: number) => {
  const data = await invokeFunction("delete-brands", {
    body: { id },
  });

  return data;
};

export const updateBrand = async (payload: EditBrandPayload) => {
  const data = await invokeFunction("update-brands", {
    body: payload,
  });

  return data;
};
