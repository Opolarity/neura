/**
 * Sanea el HTML que llega de OPOLARITY (descripción de una solicitud, mensajes
 * del equipo, protocolo de respuestas) antes de pintarlo con
 * dangerouslySetInnerHTML. Da la vuelta completa por un servicio externo y
 * parte lo escribe gente de fuera, así que no se confía en nada.
 *
 * Lista blanca, no lista negra: el HTML se parsea con DOMParser (documento
 * inerte, sin scripts ni cargas) y se reconstruye en otro documento copiando
 * solo las etiquetas y atributos permitidos. Lo que no está en la lista no
 * llega al resultado: ni SVG, ni MathML, ni formularios, ni `style`/`class`
 * (el HTML no trae estilos propios, ver SupportRichText), ni handlers.
 *
 * Los enlaces se validan con el parser de URLs del navegador, que descarta
 * tabs y saltos de línea igual que al navegar: `java&#x09;script:` se lee
 * como `javascript:` y se descarta. Un filtro por regex sobre el texto del
 * atributo no lo veía.
 */

const HTML_NS = "http://www.w3.org/1999/xhtml";

const ALLOWED_TAGS = new Set([
  "p", "br", "hr", "div", "span",
  "strong", "b", "em", "i", "u", "s", "del", "mark", "sub", "sup",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "blockquote", "pre", "code",
  "a", "img",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "colgroup", "col",
  "figure", "figcaption",
]);

/** Se descartan con todo su contenido (el resto de etiquetas no permitidas se desenvuelve y conserva su texto). */
const DROPPED_WITH_CONTENT = new Set([
  "script", "style", "template", "noscript", "iframe", "frame", "frameset",
  "object", "embed", "applet", "svg", "math", "form", "textarea", "select",
  "button", "input", "head", "title", "meta", "link", "base",
]);

/** Atributos de texto o numéricos permitidos por etiqueta (`href`/`src` van aparte). */
const TEXT_ATTRIBUTES: Record<string, string[]> = {
  "*": ["title"],
  img: ["alt"],
};
const NUMERIC_ATTRIBUTES: Record<string, string[]> = {
  img: ["width", "height"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan"],
  ol: ["start"],
  col: ["span"],
  colgroup: ["span"],
};

const LINK_PROTOCOLS = ["http:", "https:", "mailto:", "tel:"];
const IMAGE_PROTOCOLS = ["http:", "https:"];

/** URL absoluta si su protocolo está permitido; null en cualquier otro caso. */
const safeUrl = (value: string, protocols: string[]): string | null => {
  try {
    const url = new URL(value, window.location.origin);
    return protocols.includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};

const copyAttributes = (source: Element, target: Element, tag: string) => {
  for (const name of [...TEXT_ATTRIBUTES["*"], ...(TEXT_ATTRIBUTES[tag] ?? [])]) {
    const value = source.getAttribute(name);
    if (value !== null) target.setAttribute(name, value);
  }

  for (const name of NUMERIC_ATTRIBUTES[tag] ?? []) {
    const value = source.getAttribute(name)?.trim();
    if (value && /^\d{1,4}$/.test(value)) target.setAttribute(name, value);
  }

  if (tag === "a") {
    const href = safeUrl(source.getAttribute("href") ?? "", LINK_PROTOCOLS);
    if (href) {
      target.setAttribute("href", href);
      target.setAttribute("target", "_blank");
      target.setAttribute("rel", "noopener noreferrer");
    }
  }

  if (tag === "img") {
    const src = safeUrl(source.getAttribute("src") ?? "", IMAGE_PROTOCOLS);
    if (src) target.setAttribute("src", src);
  }
};

const cleanNode = (node: Node, out: Document): Node[] => {
  if (node.nodeType === Node.TEXT_NODE) return [out.createTextNode(node.textContent ?? "")];
  if (node.nodeType !== Node.ELEMENT_NODE) return [];

  const element = node as Element;
  const tag = element.localName.toLowerCase();

  // Fuera del espacio de nombres HTML (SVG, MathML) no pasa nada.
  if (element.namespaceURI !== HTML_NS || DROPPED_WITH_CONTENT.has(tag)) return [];

  const children = Array.from(element.childNodes).flatMap((child) => cleanNode(child, out));
  if (!ALLOWED_TAGS.has(tag)) return children;

  // Una imagen sin src válido no aporta nada.
  if (tag === "img" && !safeUrl(element.getAttribute("src") ?? "", IMAGE_PROTOCOLS)) return [];

  const clean = out.createElement(tag);
  copyAttributes(element, clean, tag);
  children.forEach((child) => clean.appendChild(child));
  return [clean];
};

export const sanitizeSupportHtml = (html: string | null): string => {
  if (!html) return "";

  const source = new DOMParser().parseFromString(html, "text/html");
  const out = document.implementation.createHTMLDocument("");
  const container = out.createElement("div");

  Array.from(source.body.childNodes)
    .flatMap((child) => cleanNode(child, out))
    .forEach((child) => container.appendChild(child));

  return container.innerHTML;
};

/**
 * ¿El mensaje viene en HTML? Lo normal es texto con Markdown, pero los bots
 * de Tasks publican algunas respuestas con etiquetas (`<p>`, `<strong>`...):
 * pintadas como texto se verían las etiquetas.
 */
export const looksLikeSupportHtml = (content: string): boolean =>
  /<(p|div|br|ul|ol|li|h[1-6]|pre|code|table|blockquote|strong|em|a|img)\b[^>]*>/i.test(content);
