import {
  ProductRecipe,
  RecipeState,
  RecipeStateCounts,
} from "../types/productRecipes.types";

const toTextOrNull = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") return null;
  return String(value);
};

const RECIPE_STATES: RecipeState[] = ["WITH", "WITHOUT", "PENDING"];

const toRecipeState = (value: unknown): RecipeState =>
  RECIPE_STATES.includes(value as RecipeState) ? (value as RecipeState) : "WITHOUT";

/** Fila de sp_get_products_recipes → modelo de UI. */
export const toProductRecipe = (row: any): ProductRecipe => ({
  productId: Number(row.product_id),
  productTitle: row.product_title ?? "",
  productCode: toTextOrNull(row.product_code),
  recipeState: toRecipeState(row.recipe_state),
  variationsCount: Number(row.variations_count ?? 0),
  categories: (row.categories ?? []).map((c: any) => ({
    id: Number(c.id),
    name: c.name ?? "",
  })),
  recipe: row.recipe
    ? {
        id: Number(row.recipe.id),
        modelCode: toTextOrNull(row.recipe.model_code),
        description: toTextOrNull(row.recipe.description),
        total: Number(row.recipe.total ?? 0),
        materialsCount: Number(row.recipe.materials_count ?? 0),
        processesCount: Number(row.recipe.processes_count ?? 0),
        exceptionsCount: Number(row.recipe.exceptions_count ?? 0),
      }
    : null,
  pendingRecipes: (row.pending_recipes ?? []).map((p: any) => ({
    id: Number(p.id),
    modelCode: toTextOrNull(p.model_code),
    description: toTextOrNull(p.description),
    variationsCount: Number(p.variations_count ?? 0),
  })),
});

export const toRecipeStateCounts = (raw: any): RecipeStateCounts => ({
  all: Number(raw?.all ?? 0),
  with: Number(raw?.with ?? 0),
  without: Number(raw?.without ?? 0),
  pending: Number(raw?.pending ?? 0),
});
