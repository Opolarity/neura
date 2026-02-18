import {
  AttributeGroup,
  AttributesApiResponse,
  AttributePaginationState,
} from "../types/Attributes.types";

export const attributesAdapter = (
  response: AttributesApiResponse
): {
  attributes: AttributeGroup[];
  pagination: AttributePaginationState;
} => {
  const attributes = response.data || [];
  const pagination: AttributePaginationState = {
    p_page: response.page?.page ?? 1,
    p_size: response.page?.size ?? 20,
    total: response.page?.total ?? 0,
  };

  return { attributes, pagination };
};
