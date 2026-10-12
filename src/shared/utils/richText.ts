// Utilidades para campos que se editan con WysiwygEditor (HTML) pero que
// pueden traer texto plano de antes.

const hasHtmlTags = (value: string) => /<\/?[a-z][^>]*>/i.test(value);

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/**
 * Texto plano → HTML para cargarlo en WysiwygEditor sin perder los saltos de
 * línea (Tiptap los colapsa en espacios). El HTML se devuelve tal cual.
 */
export function plainTextToHtml(value: string | null | undefined): string {
  if (!value) return "";
  if (hasHtmlTags(value)) return value;
  return value
    .split(/\r?\n/)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

/** HTML → texto en una sola línea, para celdas de tabla y títulos. */
export function htmlToPlainText(value: string | null | undefined): string {
  if (!value) return "";
  if (!hasHtmlTags(value)) return value;
  // Sin el espacio, "<p>A</p><p>B</p>" quedaría "AB".
  const spaced = value.replace(/<\/(p|div|li|h[1-6])>|<br\s*\/?>/gi, " ");
  const doc = new DOMParser().parseFromString(spaced, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
}

/** Tiptap deja "<p></p>" al borrar todo el texto: eso es "vacío". */
export function isEmptyRichText(value: string | null | undefined): boolean {
  return htmlToPlainText(value) === "";
}
