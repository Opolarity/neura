/**
 * Las notas de una cotización, listas para el recuadro de Observaciones de
 * un papel: un párrafo por línea escrita, sin las vacías.
 *
 * Vive aparte para que la Orden de Compra y la Orden de Servicio las partan
 * igual. Sin notas devuelve vacío, y el motor no dibuja el recuadro.
 */
export const notesToObservations = (notes: string | null | undefined): string[] =>
  (notes ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");
