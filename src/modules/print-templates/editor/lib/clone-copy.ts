import { NODE_ATTRIBUTE } from "./use-editable-node";
import { ZONE_LABEL_ATTR } from "./page-zones";

/**
 * Una copia, solo para ver, de lo que se repite en la hoja: el encabezado de
 * una tabla en la página en que sigue, el título de un grupo, el encabezado o
 * el pie de página. No es un nodo (no se selecciona ni sale en la Estructura)
 * y se imprime como se ve.
 *
 * - Sin lo que el original no muestra: una columna vacía oculta («Ocultar
 *   columnas vacías») se esconde con una regla de la Tabla que la copia, fuera
 *   de ella, no tendría.
 * - `hiddenColumns`: en una Tabla con «Ocultar columnas vacías» en cada
 *   grupo, las columnas (desde 1) que oculta el grupo de la copia; entonces
 *   se copia entero y se quitan esas, no las que oculta el original.
 * - `text`: lo que dice su texto (el último que tiene), como el nombre del
 *   grupo en el título; `suffix`, lo que se le agrega al final, como
 *   « (continuación)».
 */
export function cloneForCopy(
  original: HTMLElement,
  {
    text,
    suffix,
    hiddenColumns,
  }: { text?: string; suffix?: string; hiddenColumns?: number[] } = {},
): HTMLElement {
  const clone = original.cloneNode(true) as HTMLElement;
  // Lo oculto del original, fuera de la copia (los dos árboles son iguales).
  const hidden: Element[] = [];
  const walk = (from: Element, to: Element) => {
    Array.from(from.children).forEach((child, index) => {
      const copy = to.children[index];
      if (!copy) return;
      if (getComputedStyle(child).display === "none") hidden.push(copy);
      else walk(child, copy);
    });
  };
  if (hiddenColumns) {
    const cells = Array.from(clone.children);
    hiddenColumns.forEach((column) => cells[column - 1]?.remove());
  } else {
    walk(original, clone);
    hidden.forEach((element) => element.remove());
  }
  // Sin la marca de nodo: el clic derecho no lo toma por el original.
  clone.removeAttribute(NODE_ATTRIBUTE);
  clone.removeAttribute("draggable");
  clone
    .querySelectorAll(`[${NODE_ATTRIBUTE}]`)
    .forEach((element) => element.removeAttribute(NODE_ATTRIBUTE));
  // El encabezado o el pie de página: sin su lugar en la primera página, sin
  // su contorno ni su etiqueta del editor.
  clone.style.position = "static";
  clone.style.transform = "none";
  clone.style.outline = "none";
  clone
    .querySelectorAll(`[${ZONE_LABEL_ATTR}]`)
    .forEach((element) => element.remove());
  if (text !== undefined || suffix) {
    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
    let last: Text | null = null;
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      if (node.data.trim()) last = node;
    }
    if (last) last.data = `${text ?? last.data}${suffix ?? ""}`;
  }
  return clone;
}
