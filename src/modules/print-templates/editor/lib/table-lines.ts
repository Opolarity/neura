import { BLACK, type BorderLineStyle } from "./style-props";

/**
 * Las líneas de una Tabla de datos, como los bordes de Excel: el contorno,
 * las de entre filas y las de entre columnas. No son bordes de sus partes:
 * se dibujan encima, medidas sobre lo que hay, así no se duplican donde dos
 * celdas se tocan, cruzan la separación entre filas y columnas y bajan por
 * toda la fila aunque un texto ocupe más líneas que otro.
 */

/** Qué líneas lleva la Tabla. */
export type TableLines =
  "none" | "all" | "outer" | "inner" | "rows" | "columns" | "outerRows";

export const TABLE_LINE_OPTIONS: { value: TableLines; label: string }[] = [
  { value: "none", label: "Sin líneas" },
  { value: "all", label: "Todas" },
  { value: "outer", label: "Solo el contorno" },
  { value: "inner", label: "Solo las de dentro" },
  { value: "rows", label: "Entre filas" },
  { value: "columns", label: "Entre columnas" },
  { value: "outerRows", label: "Contorno y entre filas" },
];

/** Las tres clases de línea que lleva cada opción. */
export const LINE_KINDS: Record<
  TableLines,
  { outer: boolean; rows: boolean; columns: boolean }
> = {
  none: { outer: false, rows: false, columns: false },
  all: { outer: true, rows: true, columns: true },
  outer: { outer: true, rows: false, columns: false },
  inner: { outer: false, rows: true, columns: true },
  rows: { outer: false, rows: true, columns: false },
  columns: { outer: false, rows: false, columns: true },
  outerRows: { outer: true, rows: true, columns: false },
};

export interface TableLinesProps {
  lines: TableLines;
  lineStyle: BorderLineStyle;
  lineColor: string;
  /** Grosor, en mm. */
  lineWidthMm: number;
}

export const DEFAULT_TABLE_LINES: TableLinesProps = {
  lines: "none",
  lineStyle: "solid",
  lineColor: BLACK,
  lineWidthMm: 0.2,
};
