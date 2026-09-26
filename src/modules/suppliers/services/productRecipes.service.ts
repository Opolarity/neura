import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import { buildEndpoint } from "@/shared/utils/query";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import {
  toProductRecipe,
  toRecipeStateCounts,
} from "../adapters/productRecipes.adapter";
import {
  ProductRecipe,
  ProductRecipesFilters,
  RecipeStateCounts,
} from "../types/productRecipes.types";

interface ProductRecipesListResponse {
  data: ProductRecipe[];
  counts: RecipeStateCounts;
  pagination: PaginationState;
}

export const productRecipesListApi = async (
  filters: ProductRecipesFilters
): Promise<ProductRecipesListResponse> => {
  const { page = 1, size = 20, search, category_id, recipe_state } = filters;

  const endpoint = buildEndpoint("get-products-recipes", {
    page,
    size,
    search,
    category_id,
    recipe_state,
  });

  const data = await invokeFunction(endpoint, { method: "GET" });

  const raw = data?.productsdata ?? {
    data: [],
    counts: null,
    page: { page, size, total: 0 },
  };

  return {
    data: (raw.data ?? []).map(toProductRecipe),
    counts: toRecipeStateCounts(raw.counts),
    pagination: {
      p_page: raw.page?.page ?? page,
      p_size: raw.page?.size ?? size,
      total: raw.page?.total ?? 0,
    },
  };
};

/**
 * Elige cuál de las recetas antiguas de un producto queda como SU receta.
 *
 * Las demás sueltan las tallas de ese producto pero no se borran: las órdenes
 * que ya las usan siguen apuntando a ellas. `invokeFunction` para que llegue el
 * mensaje real del SP (p. ej. «El producto ya tiene la receta #14»).
 */
export const unifyExplosionApi = async (
  explosionId: number,
  productId: number
): Promise<void> => {
  await invokeFunction("unify-explosion", {
    method: "POST",
    body: { explosion_id: explosionId, product_id: productId },
  });
};
