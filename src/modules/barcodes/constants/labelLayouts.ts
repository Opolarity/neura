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
  marginX: 0,
  marginY: 0,
  offsetX: 0,
  offsetY: 0,
};

/**
 * Presets de papel. El usuario puede ajustar columnas/medidas si su rollo difiere.
 * El nombre incluye el tamaño de papel que hay que configurar en el driver de la
 * ticketera: si no coincide, el visor escala el PDF para que quepa.
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
 * Devuelve el id del preset que coincide con el layout, o "custom" si fue ajustado a mano.
 */
export const findPresetId = (layout: BarcodeLabelLayout): string => {
  const match = LABEL_LAYOUT_PRESETS.find(
    (preset) =>
      preset.layout.labelWidth === layout.labelWidth &&
      preset.layout.labelHeight === layout.labelHeight &&
      preset.layout.columns === layout.columns &&
      preset.layout.gapX === layout.gapX &&
      preset.layout.marginX === layout.marginX &&
      preset.layout.marginY === layout.marginY &&
      preset.layout.offsetX === layout.offsetX &&
      preset.layout.offsetY === layout.offsetY
  );
  return match?.id ?? "custom";
};

/**
 * Sanea un layout venido de localStorage o de los inputs del modal.
 * Evita que un valor inválido genere un PDF con páginas de 0mm o un bucle enorme.
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
    marginX: clamp(layout?.marginX, 0, 50, DEFAULT_LABEL_LAYOUT.marginX),
    marginY: clamp(layout?.marginY, 0, 50, DEFAULT_LABEL_LAYOUT.marginY),
    offsetX: clamp(layout?.offsetX, -20, 20, DEFAULT_LABEL_LAYOUT.offsetX),
    offsetY: clamp(layout?.offsetY, -20, 20, DEFAULT_LABEL_LAYOUT.offsetY),
  };
};
