import { openSheetPdf } from "@/shared/utils/sheetDocument";
import { buildRecipeDocument } from "./recipeDocument/build";

export type {
  RecipePdfData,
  RecipePdfMaterial,
} from "./recipeDocument/build";

/**
 * La receta de una prenda, impresa.
 *
 * Esto es solo la puerta. Los datos los arma `recipeDocument/build` y el dibujo
 * lo pone `shared/utils/sheetDocument`, el mismo motor de la Orden de
 * Producción y de las dos órdenes al proveedor. Era el último papel que quedaba
 * en `documentPdf`, el motor vertical.
 */
export const openRecipePdf = (data: Parameters<typeof buildRecipeDocument>[0]): void => {
  const documento = buildRecipeDocument(data);
  openSheetPdf(documento, `Receta ${data.description || `#${data.explosionId}`}`.trim());
};
