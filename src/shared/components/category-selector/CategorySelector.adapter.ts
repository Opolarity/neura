import type {
  CategoriesApiResponse,
  CategoriesPage,
} from "./CategorySelector.types";

export const categoriesFromApiAdapter = (
  raw: CategoriesApiResponse,
): CategoriesPage => ({
  data: (raw.data || []).map((c) => ({
    id: c.id,
    name: c.name,
  })),
  pagination: raw.page,
});
