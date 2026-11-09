import type { PrintData } from "../editor/lib/print-data";

/**
 * Imprimir un documento del ERP con su plantilla: la de por defecto del
 * tenant o, si no tiene, la del sistema. Lo arma PrintHost (montado una vez,
 * en App) y lo muestra en un modal, con Descargar y Abrir en otra pestaña; o
 * lo manda a imprimir sin mostrarlo (el POS), o solo lo entrega (PrintMode).
 *
 * Este archivo no carga el editor: solo la cola. El editor se carga al
 * imprimir el primero.
 */
export interface PrintRequest {
  id: number;
  /** El code de la plantilla del sistema (constants/systemPrintTemplates). */
  code: string;
  /**
   * Los datos del documento o una lista de registros: cada uno, sus páginas,
   * uno tras otro en el mismo PDF (las etiquetas o los tickets de varias
   * cosas, repartidos en las columnas del rollo).
   */
  data: PrintData | readonly PrintData[];
  /** El nombre al descargarlo, sin «.pdf». */
  fileName: string;
  /**
   * Qué se hace con el PDF: mostrarlo en el modal (`preview`), abrir en
   * seguida el diálogo de impresión del navegador (`direct`, el POS) o solo
   * entregarlo (`blob`, para adjuntarlo, como WhatsApp).
   */
  mode: PrintMode;
  /** El PDF listo; null si falló (ya se avisó) o se cerró antes. */
  done: (pdf: Blob | null) => void;
}

export type PrintMode = "preview" | "direct" | "blob";

let queue: readonly PrintRequest[] = [];
let lastId = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export const printQueue = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  /** El que se imprime ahora: uno a la vez. */
  current: (): PrintRequest | null => queue[0] ?? null,
  /** Lo saca de la cola (al cerrar su modal) y sigue el siguiente. */
  finish(id: number) {
    queue = queue.filter((request) => request.id !== id);
    emit();
  },
};

/**
 * Imprime `data` (los datos del documento, por fuente, como sus datos de
 * ejemplo: constants/printDataSources) con la plantilla de `code`: en el
 * modal o, con `direct`, en el diálogo de impresión. Se resuelve en true
 * cuando el PDF está listo; en false si falló (ya lo avisó) o se cerró antes.
 */
export function printDocument(
  code: string,
  data: PrintData | readonly PrintData[],
  {
    fileName = code,
    direct = false,
  }: { fileName?: string; direct?: boolean } = {},
): Promise<boolean> {
  return enqueue(code, data, fileName, direct ? "direct" : "preview").then(
    Boolean,
  );
}

/**
 * El PDF de un documento con su plantilla, sin mostrarlo ni imprimirlo (para
 * adjuntarlo); null si falló (ya lo avisó).
 */
export function renderDocumentPdf(
  code: string,
  data: PrintData | readonly PrintData[],
  fileName: string = code,
): Promise<Blob | null> {
  return enqueue(code, data, fileName, "blob");
}

function enqueue(
  code: string,
  data: PrintData | readonly PrintData[],
  fileName: string,
  mode: PrintMode,
): Promise<Blob | null> {
  return new Promise((done) => {
    lastId += 1;
    queue = [...queue, { id: lastId, code, data, fileName, mode, done }];
    emit();
  });
}
