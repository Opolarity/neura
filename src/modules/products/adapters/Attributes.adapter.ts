import {
  AttributeGroup,
  AttributeRow,
  AttributesApiResponse,
  AttributePaginationState,
} from "../types/Attributes.types";

export const flattenAttributeGroups = (
  groups: AttributeGroup[]
): AttributeRow[] => {
  const rows: AttributeRow[] = [];

  groups.forEach((group) => {
    const totalProducts = group.terms.reduce((sum, t) => sum + t.products, 0);

    rows.push({
      id: group.group_id,
      type: "group",
      name: group.group_name,
      products: totalProducts,
    });

    group.terms.forEach((term) => {
      rows.push({
        id: term.id,
        type: "term",
        name: term.name,
        products: term.products,
        groupId: group.group_id,
        groupName: group.group_name,
      });
    });
  });

  return rows;
};

export const attributesAdapter = (
  response: AttributesApiResponse
): {
  attributes: AttributeRow[];
  pagination: AttributePaginationState;
} => {
  const attributes = flattenAttributeGroups(response.data || []);
  const pagination: AttributePaginationState = {
    p_page: response.page ?? 1,
    p_size: response.size ?? 20,
    total: response.total ?? 0,
  };

  return { attributes, pagination };
};
