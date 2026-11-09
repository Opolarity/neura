import type {
  Imposition,
  ImpositionLayout,
  PaperPreset,
  SystemPrintTemplate,
} from "../../types/printTemplates.types";

/**
 * Imposición: cómo pasa la página lógica (lo que se diseña en el editor, con
 * su ancho y alto) a la hoja física (lo que sale en el PDF). La paginación
 * (cortes de tabla, saltos) se calcula siempre sobre la página lógica; la
 * imposición solo acomoda esas páginas en las hojas, así cambiar columnas o
 * copias no rompe ningún corte.
 *
 *   Columnas  la misma página lógica, N veces lado a lado en la hoja.
 *   Copias    el documento entero, N veces, intercalado o agrupado.
 */

/** Sin imposición: una columna y una copia. */
export const DEFAULT_IMPOSITION: Imposition = {
  columns: 1,
  gapMm: 0,
  marginLeftMm: 0,
  marginRightMm: 0,
  copies: 1,
  order: "collated",
};

export const MAX_COLUMNS = 10;
export const MAX_COPIES = 100;
/** Lo más que mide una separación o un margen, en mm. */
export const MAX_SPACE_MM = 100;

const clamp = (value: unknown, min: number, max: number, fallback: number) => {
  const number = Number(value);
  return value !== undefined && value !== null && Number.isFinite(number)
    ? Math.min(max, Math.max(min, number))
    : fallback;
};

/**
 * La imposición de una plantilla, completa y dentro de sus límites: lo que
 * guarda su Hoja; lo que no guarda (las plantillas de antes no guardan nada),
 * de la recomendada de su plantilla del sistema o sin imposición.
 */
export const impositionOf = (
  system: SystemPrintTemplate,
  saved?: unknown,
): Imposition => {
  const base: Imposition = {
    ...DEFAULT_IMPOSITION,
    ...system.impositionPresets?.[0]?.imposition,
  };
  if (!saved || typeof saved !== "object") return base;
  const raw = saved as Partial<Record<keyof Imposition, unknown>>;
  return {
    ...layoutOf(raw, base),
    copies: Math.round(clamp(raw.copies, 1, MAX_COPIES, base.copies)),
    order:
      raw.order === "grouped" || raw.order === "collated"
        ? raw.order
        : base.order,
  };
};

/** Columnas, separación y márgenes, dentro de sus límites. */
const layoutOf = (
  raw: Partial<Record<keyof ImpositionLayout, unknown>>,
  base: ImpositionLayout,
): ImpositionLayout => ({
  columns: Math.round(clamp(raw.columns, 1, MAX_COLUMNS, base.columns)),
  gapMm: clamp(raw.gapMm, 0, MAX_SPACE_MM, base.gapMm),
  marginLeftMm: clamp(raw.marginLeftMm, 0, MAX_SPACE_MM, base.marginLeftMm),
  marginRightMm: clamp(raw.marginRightMm, 0, MAX_SPACE_MM, base.marginRightMm),
});

/**
 * Ancho de la hoja física: las columnas, con su separación entre ellas y los
 * márgenes. El alto es el de la página lógica.
 */
export const sheetWidthMm = (pageWidthMm: number, imposition: Imposition) =>
  imposition.marginLeftMm +
  pageWidthMm * imposition.columns +
  imposition.gapMm * (imposition.columns - 1) +
  imposition.marginRightMm;

/** Dónde empieza cada columna en la hoja física, en mm desde la izquierda. */
export const columnOffsetsMm = (pageWidthMm: number, imposition: Imposition) =>
  Array.from(
    { length: imposition.columns },
    (_, column) =>
      imposition.marginLeftMm + column * (pageWidthMm + imposition.gapMm),
  );

/**
 * La página lógica que lleva cada hoja física, en orden: tantas hojas como
 * páginas por copias. Intercalado: 1, 2, 3, 1, 2, 3; agrupado: 1, 1, 2, 2, 3,
 * 3 (aquí, índices desde 0).
 */
export const sheetPages = (pageCount: number, imposition: Imposition) => {
  const pages = Array.from({ length: pageCount }, (_, page) => page);
  const copies = Array.from({ length: imposition.copies });
  return imposition.order === "grouped"
    ? pages.flatMap((page) => copies.map(() => page))
    : copies.flatMap(() => pages);
};

/** Mismas columnas, separación y márgenes: qué recomendada está elegida. */
export const sameColumns = (
  a: Pick<Imposition, "columns" | "gapMm" | "marginLeftMm" | "marginRightMm">,
  b: Imposition,
) =>
  a.columns === b.columns &&
  a.gapMm === b.gapMm &&
  a.marginLeftMm === b.marginLeftMm &&
  a.marginRightMm === b.marginRightMm;

/**
 * La medida de la Hoja con que se recuerda su impresión (impositionBySize de
 * la Hoja): la de una recomendada o «custom» para la personalizada.
 */
export const paperSizeKey = (
  presets: readonly PaperPreset[] | undefined,
  widthMm: number,
  heightMm: number,
) =>
  presets?.some(
    (preset) => preset.widthMm === widthMm && preset.heightMm === heightMm,
  )
    ? `${widthMm}x${heightMm}`
    : "custom";
