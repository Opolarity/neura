import type { PaperHeight } from "../types/printTemplates.types";

const formatMm = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

/**
 * "100 × 140 mm", "210 × 297 mm · varias páginas", "100 × 140 mm · elegible"
 * (se elige al crearla) o "80 mm × alto automático" en el papel de rollo.
 */
export const formatPaper = (
  widthMm: number,
  heightMm: PaperHeight,
  multiPage = false,
  editable = false,
) =>
  heightMm === "auto"
    ? `${formatMm(widthMm)} mm × alto automático`
    : `${formatMm(widthMm)} × ${formatMm(heightMm)} mm${multiPage ? " · varias páginas" : ""}${editable ? " · elegible" : ""}`;
