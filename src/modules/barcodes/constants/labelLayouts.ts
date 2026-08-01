import { BarcodeLabelLayout } from "../types/Barcodes.types";

/**
 * Formato por defecto: rollo de 1 columna (ticketera tradicional).
 * Equivale al comportamiento histórico: cada página del PDF es una etiqueta 30x20mm.
 */
export const DEFAULT_LABEL_LAYOUT: BarcodeLabelLayout = {
  labelWidth: 30,
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
    layout: { ...DEFAULT_LABEL_LAYOUT, columns: 2, gapX: 2, labelHeight: 25 },
  },
  {
    id: "roll-3col",
    name: "Rollo 3 columnas — papel 94x25mm",
    layout: { ...DEFAULT_LABEL_LAYOUT, columns: 3, gapX: 2, labelHeight: 25 },
  },
];

export const LABEL_LAYOUT_STORAGE_KEY = "neura:barcodes:labelLayout";

/**
 * Tamaño de papel que produce el layout: es el que debe configurarse en la impresora.
 */
export const getPaperSize = (layout: BarcodeLabelLayout) => ({
  width: layout.columns * layout.labelWidth + (layout.columns - 1) * layout.gapX,
  height: layout.labelHeight,
});

/**
 * Sanea un layout venido de localStorage. Evita que un valor inválido guardado por
 * una versión anterior genere un PDF con páginas de 0mm o un bucle enorme.
 */
export const normalizeLabelLayout = (
  layout: Partial<BarcodeLabelLayout> | null | undefined
): BarcodeLabelLayout => {
  const clamp = (value: unknown, min: number, max: number, fallback: number) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    return Math.min(max, Math.max(min, num));
  };

  return {
    labelWidth: clamp(layout?.labelWidth, 10, 200, DEFAULT_LABEL_LAYOUT.labelWidth),
    labelHeight: clamp(layout?.labelHeight, 8, 200, DEFAULT_LABEL_LAYOUT.labelHeight),
    columns: Math.round(clamp(layout?.columns, 1, 10, DEFAULT_LABEL_LAYOUT.columns)),
    gapX: clamp(layout?.gapX, 0, 50, DEFAULT_LABEL_LAYOUT.gapX),
  };
};
