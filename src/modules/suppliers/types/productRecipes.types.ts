import { ExplosionCategory } from "./explosions.types";

/**
 * En qué punto está la receta de un producto. Son excluyentes:
 *
 * - `WITH`: tiene su receta.
 * - `PENDING`: no la tiene, pero hay recetas antiguas que cubren sus prendas y
 *   hay que elegir cuál queda (se unifica desde la ficha de la receta).
 * - `WITHOUT`: ni una cosa ni la otra.
 */
export type RecipeState = "WITH" | "WITHOUT" | "PENDING";

/** La receta de un producto, tal como se resume en el listado. */
export interface ProductRecipeSummary {
  id: number;
  modelCode: string | null;
  description: string | null;
  total: number;
  materialsCount: number;
  processesCount: number;
  /** Cuántas prendas tienen una cantidad propia en algún material. */
  exceptionsCount: number;
}

/** Receta antigua que compite por el producto. */
export interface PendingRecipe {
  id: number;
  modelCode: string | null;
  description: string | null;
  variationsCount: number;
}

/** Fila de "Recetas": un producto y su receta. */
export interface ProductRecipe {
  productId: number;
  productTitle: string;
  productCode: string | null;
  recipeState: RecipeState;
  variationsCount: number;
  categories: ExplosionCategory[];
  recipe: ProductRecipeSummary | null;
  pendingRecipes: PendingRecipe[];
}

/** Cuántos productos hay en cada estado, con la búsqueda y la categoría aplicadas. */
export interface RecipeStateCounts {
  all: number;
  with: number;
  without: number;
  pending: number;
}

export interface ProductRecipesFilters {
  search?: string | null;
  /** Arrastra las subcategorías: el SP resuelve el árbol. */
  category_id?: number | null;
  /** null = todos. */
  recipe_state?: RecipeState | null;
  page?: number;
  size?: number;
}
