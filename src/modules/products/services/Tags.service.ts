import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/query";
import type { CreateTagPayload, EditTagPayload, GetTagsResponse } from "@/modules/products/types/Tags.types";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";

interface GetTagsParams {
  page?: number;
  size?: number;
  search?: string;
}

export const getTags = async (params: GetTagsParams = {}): Promise<GetTagsResponse> => {
  const endpoint = buildEndpoint("get-tags", params);
  const data = await invokeFunction<GetTagsResponse>(endpoint);

  return data;
};

export const createTag = async (payload: CreateTagPayload) => {
  const data = await invokeFunction("create-tags", {
    body: payload,
  });

  return data;
};

export const deleteTag = async (id: number) => {
  const data = await invokeFunction("delete-tags", {
    body: { id },
  });

  return data;
};

export const updateTag = async (payload: EditTagPayload) => {
  const data = await invokeFunction("update-tags", {
    body: payload,
  });

  return data;
};
