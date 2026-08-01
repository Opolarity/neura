import { BarcodeLabelLayout } from "../types/Barcodes.types";

/** Ancho mínimo utilizable de una etiqueta, para que el gap no las deje ilegibles. */
const MIN_LABEL_WIDTH = 10;

/**
 * Formato por defecto: rollo de 1 columna (ticketera tradicional).
 * Equivale al comportamiento histórico: cada página del PDF es una etiqueta 30x20mm.
 */
export const DEFAULT_LABEL_LAYOUT: BarcodeLabelLayout = {
  paperWidth: 30,
  labelHeight: 20,
  columns: 1,
  gapX: 0,
};

/**
 * Formatos de rollo soportados. El nombre incluye el tamaño de papel que hay que
 * configurar en el driver de la ticketera: si no coincide, el visor escala el PDF
 * para que quepa y las etiquetas salen encogidas.
 */
export const LABEL_LAYOUT_PRESETS: { id: string; name: string; layout: BarcodeLabelLayout }[] = [
  {
    id: "roll-1col",
    name: "Rollo 1 columna — papel 30x20mm",
    layout: DEFAULT_LABEL_LAYOUT,
  },
  {
    id: "roll-2col",
    name: "Rollo 2 columnas — papel 62x25mm",
    layout: { paperWidth: 62, labelHeight: 25, columns: 2, gapX: 2 },
  },
  {
    id: "roll-3col",
    name: "Rollo 3 columnas — papel 94x25mm",
    layout: { paperWidth: 94, labelHeight: 25, columns: 3, gapX: 2 },
  },
];

export const LABEL_LAYOUT_STORAGE_KEY = "neura:barcodes:labelLayout";

/**
 * Ancho de cada etiqueta: el papel se reparte entre las columnas descontando los gaps.
 * Subir el gap empuja las etiquetas hacia los bordes sin cambiar el ancho del papel,
 * que es lo que corrige un rollo cuyo paso real es mayor al que asume el preset.
 */
export const getLabelWidth = (layout: BarcodeLabelLayout) =>
  (layout.paperWidth - (layout.columns - 1) * layout.gapX) / layout.columns;

/** Gap máximo que deja las etiquetas por encima del ancho mínimo utilizable. */
export const getMaxGapX = (paperWidth: number, columns: number) =>
  columns > 1 ? Math.max(0, (paperWidth - columns * MIN_LABEL_WIDTH) / (columns - 1)) : 0;

/** Layout tal como puede venir de localStorage, incluida la forma anterior. */
type StoredLabelLayout = Partial<BarcodeLabelLayout> & {
  /** Versiones previas guardaban el ancho de UNA etiqueta en vez del rollo completo. */
  labelWidth?: number;
};

/**
 * Sanea un layout venido de localStorage. Evita que un valor inválido guardado por
 * una versión anterior genere un PDF con páginas de 0mm o un bucle enorme, y migra
 * el formato viejo (labelWidth) al actual (paperWidth).
 */
export const normalizeLabelLayout = (
  layout: StoredLabelLayout | null | undefined
): BarcodeLabelLayout => {
  const clamp = (value: unknown, min: number, max: number, fallback: number) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    return Math.min(max, Math.max(min, num));
  };

  const columns = Math.round(clamp(layout?.columns, 1, 10, DEFAULT_LABEL_LAYOUT.columns));

  // Migración: reconstruye el ancho del rollo a partir del ancho de etiqueta anterior
  const legacyLabelWidth = Number(layout?.labelWidth);
  const legacyGap = Number(layout?.gapX);
  const storedPaperWidth =
    layout?.paperWidth ??
    (Number.isFinite(legacyLabelWidth)
      ? columns * legacyLabelWidth +
        (columns - 1) * (Number.isFinite(legacyGap) ? legacyGap : 0)
      : undefined);

  const paperWidth = clamp(
    storedPaperWidth,
    columns * MIN_LABEL_WIDTH,
    500,
    DEFAULT_LABEL_LAYOUT.paperWidth
  );

  return {
    paperWidth,
    labelHeight: clamp(layout?.labelHeight, 8, 200, DEFAULT_LABEL_LAYOUT.labelHeight),
    columns,
    gapX: clamp(layout?.gapX, 0, getMaxGapX(paperWidth, columns), DEFAULT_LABEL_LAYOUT.gapX),
  };
};
