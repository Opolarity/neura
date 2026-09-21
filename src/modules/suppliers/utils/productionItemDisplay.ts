/**
 * Cómo se nombra una prenda de una orden en pantalla.
 *
 * El backend manda producto, variación y sku por separado
 * (`fn_production_order_item_display`); aquí se decide cómo se unen, y se
 * decide UNA vez para que el Plan Maestro y la orden digan lo mismo. El sku no
 * va en el nombre: se pinta debajo, en pequeño, porque no dice qué talla es.
 */
export interface ProductionItemDisplayParts {
  productTitle: string | null;
  /** Talla y color, ya unidos por el backend: «S / Azul». */
  variationTerms: string | null;
}

/** «Polo Básico - S / Blanco», o el fallback cuando no hay producto. */
export const itemDisplayName = (
  parts: ProductionItemDisplayParts,
  fallback = "",
): string =>
  [parts.productTitle, parts.variationTerms].filter(Boolean).join(" - ") ||
  fallback;

/**
 * La talla POR SEPARADO del resto de términos, tal como la manda el backend
 * (`fn_production_order_item_display` y los items de
 * `sp_get_production_order_by_id`, misma regla que el Plan Maestro:
 * `term_groups.code = 'Tallas'`).
 *
 * Es lo que permite pintar las prendas como rejilla —una columna por talla—
 * en la Orden de Servicio. `variationTerms` sigue siendo el texto ya unido
 * para quien solo necesite nombrar la prenda.
 */
export interface ProductionItemSizeParts {
  productTitle: string | null;
  /** Id del término de talla: el orden del catálogo (S, M, L), no el alfabético. */
  sizeTermId: number | null;
  /** «S», «32»… Null si la variación no tiene talla. */
  sizeTerm: string | null;
  /** El sistema de tallas —«Tallas», «Tallas Pantalon»—. Null sin talla. */
  sizeGroup: string | null;
  /** Los términos que NO son talla —el color—, ya unidos. Null si no hay. */
  otherTerms: string | null;
}

const textOrNull = (value: unknown): string | null =>
  value === undefined || value === null || value === "" ? null : String(value);

const numOrNull = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Las claves del backend → `ProductionItemSizeParts`. Una sola vez para los
 * tres lectores que las traen, para que ninguno se olvide de una.
 */
export const toItemSizeParts = (
  row: Record<string, unknown> | null | undefined,
): ProductionItemSizeParts => ({
  productTitle: textOrNull(row?.product_title),
  sizeTermId: numOrNull(row?.size_term_id),
  sizeTerm: textOrNull(row?.size_term),
  sizeGroup: textOrNull(row?.size_group),
  otherTerms: textOrNull(row?.other_terms),
});
