/**
 * Datos del propio documento para un Texto (grupo «Documento» del Origen): el
 * número de página y la fecha en que se genera, cada uno con su formato. No
 * se escriben a mano.
 *
 * El número de página no lo sabe React: cada Texto lo escribe en un elemento
 * marcado (PAGE_NUMBER_ATTR) y la hoja (components/paper-canvas) pone en cada
 * uno el de la página en que cae; en las copias del encabezado y del pie
 * (components/header-copies), el de la página de la copia. El PDF lee lo que
 * se ve.
 */

export const DOCUMENT_SOURCE = "document";

export type DocumentKey = "page" | "date";

export const DOCUMENT_FIELDS: readonly { key: DocumentKey; label: string }[] = [
  { key: "page", label: "Número de página" },
  { key: "date", label: "Fecha" },
];

export type PageFormat = "n" | "page" | "of" | "page_of" | "slash";

export const formatPage = (format: string, page: number, total: number) => {
  switch (format as PageFormat) {
    case "page":
      return `Página ${page}`;
    case "of":
      return `${page} de ${total}`;
    case "page_of":
      return `Página ${page} de ${total}`;
    case "slash":
      return `${page} / ${total}`;
    default:
      return String(page);
  }
};

export const PAGE_FORMATS: readonly { value: PageFormat; label: string }[] = (
  ["n", "page", "of", "page_of", "slash"] as const
).map((value) => ({ value, label: formatPage(value, 1, 3) }));

export type DateFormat = "short" | "short2" | "long" | "datetime" | "datetime2";

const pad = (value: number) => String(value).padStart(2, "0");

/** La fecha y la hora de Lima, como las escriben los documentos de hoy. */
export const formatDate = (format: string, date = new Date()) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("es-PE", {
      timeZone: "America/Lima",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  const day = pad(Number(parts.day));
  const month = pad(Number(parts.month));
  const year = String(parts.year);
  const time = `${pad(Number(parts.hour) % 24)}:${pad(Number(parts.minute))}`;
  switch (format as DateFormat) {
    case "short2":
      return `${day}/${month}/${year.slice(2)}`;
    case "long":
      return new Intl.DateTimeFormat("es-PE", {
        timeZone: "America/Lima",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
    case "datetime":
      return `${day}/${month}/${year} ${time}`;
    case "datetime2":
      return `${day}/${month}/${year.slice(2)}, ${time}`;
    default:
      return `${day}/${month}/${year}`;
  }
};

/** Los formatos de la fecha, con la de hoy de ejemplo. */
export const dateFormats = (): { value: DateFormat; label: string }[] =>
  (["short", "short2", "long", "datetime", "datetime2"] as const).map(
    (value) => ({ value, label: formatDate(value) }),
  );

/** Marca dónde va un número de página, con su formato como valor. */
export const PAGE_NUMBER_ATTR = "data-page-number";

/**
 * Escribe el número de página en cada marca dentro de `root`: el de la página
 * que diga `pageOf` (desde 1), de `total`. Solo si cambia: escribir dispara
 * los observadores de la hoja.
 */
export function writePageNumbers(
  root: ParentNode,
  pageOf: (element: HTMLElement) => number,
  total: number,
) {
  root
    .querySelectorAll<HTMLElement>(`[${PAGE_NUMBER_ATTR}]`)
    .forEach((element) => {
      const next = formatPage(
        element.getAttribute(PAGE_NUMBER_ATTR) ?? "n",
        pageOf(element),
        total,
      );
      if (element.textContent === next) return;
      // En el mismo nodo de texto que puso React, si lo hay.
      const node = element.firstChild;
      if (node && node.nodeType === Node.TEXT_NODE && !node.nextSibling)
        node.nodeValue = next;
      else element.textContent = next;
    });
}
