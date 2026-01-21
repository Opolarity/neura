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

  groups.forEach((group, groupIndex) => {
    const totalProducts = group.terms.reduce((sum, t) => sum + t.products, 0);

    rows.push({
      id: `group-${groupIndex}`,
      type: "group",
      name: group.group_name,
      products: totalProducts,
    });

    group.terms.forEach((term, termIndex) => {
      rows.push({
        id: `term-${groupIndex}-${termIndex}`,
        type: "term",
        name: term.name,
        products: term.products,
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
  const attributes = flattenAttributeGroups(response.data);
  const pagination: AttributePaginationState = {
    p_page: response.page.page,
    p_size: response.page.size,
    total: response.page.total,
  };

  return { attributes, pagination };
};
