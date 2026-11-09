import { createContext, useContext } from "react";
import type {
  PrintDataRow,
  PrintDataSource,
  PrintDataSourceId,
} from "../../constants/printDataSources";

/**
 * Los datos de un documento de verdad, por fuente: las filas de sus Tablas y
 * los valores sueltos de sus Textos (los mismos campos que los de ejemplo).
 */
export type PrintData = Partial<
  Record<
    PrintDataSourceId,
    { rows?: readonly PrintDataRow[]; values?: PrintDataRow }
  >
>;

/**
 * Los datos del documento que se imprime (print/print-document). Sin él (el
 * editor, la vista, Probar PDF) cada fuente da los suyos de ejemplo; con él,
 * solo los del documento: lo que no trae, sale vacío.
 */
export const PrintDataContext = createContext<PrintData | null>(null);

export const usePrintData = () => useContext(PrintDataContext);

/** Un valor suelto de una fuente: el del documento o el de ejemplo. */
export function useSourceValue() {
  const data = usePrintData();
  return (source: PrintDataSource | null | undefined, key: string) => {
    if (!source) return undefined;
    return data ? data[source.id]?.values?.[key] : source.mockValues?.[key];
  };
}

/** Las filas del documento de una fuente; null sin documento (las de ejemplo). */
export const rowsOf = (data: PrintData | null, sourceId: PrintDataSourceId) =>
  data ? (data[sourceId]?.rows ?? []) : null;
