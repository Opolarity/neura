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
    imageUrl: c.imageUrl ?? null,
  })),
  pagination: raw.page,
});
