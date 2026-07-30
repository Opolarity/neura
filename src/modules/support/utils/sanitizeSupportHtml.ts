/**
 * Sanea el HTML de la descripción antes de pintarlo con dangerouslySetInnerHTML.
 * El contenido lo escribe el WysiwygEditor del propio ERP y vuelve por OPOLARITY,
 * pero da la vuelta completa por un servicio externo: se limpia igual.
 *
 * Se usa el parser del navegador (DOMParser) en vez de regex: los regex sobre
 * HTML se saltan casos como `<scr<script>ipt>` o atributos con saltos de línea.
 */

const FORBIDDEN_TAGS = ["script", "iframe", "style", "object", "embed", "link", "meta"];

/** Atributos que aceptan una URL y por tanto podrían traer `javascript:`. */
const URL_ATTRIBUTES = ["href", "src", "xlink:href", "action", "formaction"];

const isUnsafeUrl = (value: string): boolean =>
  /^\s*(javascript|vbscript|data:text\/html)/i.test(value);

export const sanitizeSupportHtml = (html: string | null): string => {
  if (!html) return "";

  const doc = new DOMParser().parseFromString(html, "text/html");

  doc.body.querySelectorAll(FORBIDDEN_TAGS.join(",")).forEach((node) => node.remove());

  doc.body.querySelectorAll("*").forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();

      // Handlers inline (onclick, onerror, onload...)
      if (name.startsWith("on")) {
        element.removeAttribute(attribute.name);
        return;
      }

      if (URL_ATTRIBUTES.includes(name) && isUnsafeUrl(attribute.value)) {
        element.removeAttribute(attribute.name);
      }
    });
  });

  return doc.body.innerHTML;
};
