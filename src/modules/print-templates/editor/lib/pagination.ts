import { createContext, useContext, useSyncExternalStore } from "react";
import { ROOT_NODE, type Node, type NodeId, type Nodes } from "@craftjs/core";
import {
  DATA_TABLE_NAME,
  GROUP_FOOTER_ATTR,
  GROUP_HEADING_ATTR,
  groupPushKey,
  TABLE_PARTS,
  tableRows,
} from "./data-table";
import { PX_PER_MM } from "./units";

/** El grupo de cada fila, en su envoltorio (components/pdf-data-table). */
const GROUP_NAME_ATTR = "data-table-group-name";

/** Las columnas que oculta el grupo de cada fila (components/pdf-data-table). */
const GROUP_HIDDEN_ATTR = "data-table-group-hidden";
import { zoneOnPage, type ZonePages } from "./page-zones";

/**
 * Los saltos de página de una hoja de varias páginas, como en Word. La hoja
 * del editor es una tira continua; al llegar al final de una página:
 *
 * - un Texto se parte entre dos líneas: lo que sigue va a la página siguiente;
 * - una Tabla de datos se parte entre dos filas, y la página nueva lleva una
 *   copia de su encabezado;
 * - un Contenedor en columna deja pasar a sus hijos, que se parten igual;
 * - lo demás (un Contenedor en fila, de alto fijo…) baja entero si cabe en
 *   una página; si no cabe, cruza el corte.
 *
 * Bajar algo es ponerle un espacio arriba (un empujón); partir un Texto es
 * ponerle un espacio entre dos de sus líneas. Son solo de la vista: no se
 * guardan en la plantilla y se recalculan con cada cambio
 * (components/paper-canvas). La impresión hará el mismo cálculo.
 */

/** La primera línea de un Texto que no entra hasta una altura. */
export interface TextLine {
  /** Dónde empieza la línea en el texto (carácter). 0: es la primera. */
  index: number;
  /** Arriba de la línea, en px sin escalar y sin saltos. */
  top: number;
}

/** Lo que puede saltar de página, en px sin escalar desde arriba, sin saltos. */
export interface PageUnit {
  /** El nodo al que se le pone el espacio arriba (o dentro, si es un Texto). */
  target: NodeId;
  top: number;
  bottom: number;
  /**
   * Una fila de una Tabla de datos (no la primera): si salta, la página nueva
   * lleva antes el encabezado de la tabla, de este alto (0 si está oculto).
   */
  repeatHeader?: {
    /** Lo que se copia, en orden: el título y el encabezado de la tabla. */
    parts: {
      id: NodeId;
      height: number;
      suffix?: string;
      text?: string;
      hiddenColumns?: number[];
    }[];
    height: number;
  };
  /**
   * Un Texto: la primera de sus líneas cuyo final pasa de una altura (sin
   * saltos), para partirlo ahí. Null si todas entran.
   */
  lineAfter?: (limit: number) => TextLine | null;
}

/** El encabezado o el pie de página: su alto y en qué páginas sale. */
export interface PageZoneBox {
  height: number;
  pages: ZonePages;
}

/** La geometría de una página, en px sin escalar. */
export interface PageBox {
  height: number;
  /** Margen interior de la Hoja: se repite arriba y abajo en cada página. */
  marginTop: number;
  marginBottom: number;
  /** Lo que ocupan el encabezado y el pie en las páginas en que salen. */
  header?: PageZoneBox | null;
  footer?: PageZoneBox | null;
}

/** Una copia del encabezado de una tabla, arriba de una página. */
export interface HeaderCopy {
  headerId: NodeId;
  /** Dónde va, en px sin escalar desde arriba de la hoja. */
  top: number;
  /** En qué página (desde 1): para su número de página. */
  page: number;
  /** Lo que se le agrega a su texto: « (continuación)». */
  suffix?: string;
  /** Lo que dice su texto, si no es el del original (el nombre del grupo). */
  text?: string;
  /** Las columnas que oculta su grupo («Ocultar columnas vacías»). */
  hiddenColumns?: number[];
}

/** Un salto dentro de un Texto: antes del carácter `index`, un espacio. */
export interface TextSplit {
  index: number;
  gap: number;
}

/** Lo que le toca a un nodo: un espacio arriba y, si es un Texto, dentro. */
export interface PageBreak {
  push: number;
  splits: TextSplit[];
}

export interface Pagination {
  breaks: Map<NodeId, PageBreak>;
  headers: HeaderCopy[];
}

export const EMPTY_PAGINATION: Pagination = { breaks: new Map(), headers: [] };

const NO_SPLITS: TextSplit[] = [];

const round = (value: number) => Math.round(value * 10) / 10;

/**
 * Los saltos de página para unidades medidas sin saltos (su posición
 * natural), en el orden en que van en la hoja: cada espacio baja todo lo que
 * viene después.
 */
export function paginate(units: PageUnit[], page: PageBox): Pagination {
  const breaks = new Map<NodeId, PageBreak>();
  const headers: HeaderCopy[] = [];
  // Lo que ocupan el encabezado y el pie en una página (0 si no sale).
  const zone = (box: PageZoneBox | null | undefined, index: number) =>
    box && zoneOnPage(box.pages, index) ? box.height : 0;
  const usable =
    page.height -
    page.marginTop -
    page.marginBottom -
    (page.header?.height ?? 0) -
    (page.footer?.height ?? 0);
  // Cuánto bajó ya todo lo que viene (los espacios de antes).
  let shift = 0;
  const topOf = (index: number) =>
    index * page.height + page.marginTop + zone(page.header, index);
  const contentOf = (y: number) => {
    const index = Math.max(0, Math.floor(y / page.height));
    return {
      index,
      top: topOf(index),
      bottom:
        (index + 1) * page.height -
        page.marginBottom -
        zone(page.footer, index),
      next: topOf(index + 1),
    };
  };

  for (const unit of units) {
    // La copia del encabezado de la tabla (si la tabla lo repite): sale
    // aunque la página lleve encabezado de página, debajo de él.
    const header = () => unit.repeatHeader?.height ?? 0;
    let push = 0;
    const splits: TextSplit[] = [];
    const top = () => unit.top + shift;
    const bottom = () => unit.bottom + shift;

    // No empieza en el margen de arriba de una página (ni en su encabezado).
    const first = contentOf(top());
    if (top() < first.top - 0.5) {
      const gap = round(first.top - top());
      push += gap;
      shift += gap;
    }

    // Lo que se parte (un Texto): entre dos líneas, tantas veces como haga
    // falta. Una línea más alta que una página no se puede bajar: cruza.
    if (unit.lineAfter) {
      // Dónde empieza lo que queda del Texto (al principio, el Texto).
      let cursor = top();
      let lastIndex = -1;
      for (let guard = 0; guard < 100; guard++) {
        const content = contentOf(cursor);
        if (bottom() <= content.bottom + 0.5) break;
        const line = unit.lineAfter(content.bottom - shift);
        if (!line || line.index === lastIndex) break;
        lastIndex = line.index;
        const gap = round(content.next - (line.top + shift));
        if (gap <= 0) break;
        // La primera línea no entra: baja el Texto entero.
        if (line.index === 0) push += gap;
        else splits.push({ index: line.index, gap });
        shift += gap;
        cursor = content.next;
      }
    } else {
      // Lo que no se parte: baja entero si cabe en una página.
      const content = contentOf(top());
      const headerHeight = header();
      if (
        bottom() - top() + headerHeight <= usable &&
        bottom() > content.bottom + 0.5
      ) {
        const start = content.next;
        const gap = round(start + headerHeight - top());
        if (gap > 0) {
          push += gap;
          shift += gap;
          if (unit.repeatHeader && headerHeight > 0) {
            let offset = 0;
            for (const part of unit.repeatHeader.parts) {
              headers.push({
                headerId: part.id,
                top: round(start + offset),
                page: content.index + 2,
                suffix: part.suffix,
                text: part.text,
                hiddenColumns: part.hiddenColumns,
              });
              offset += part.height;
            }
          }
        }
      }
    }

    if (push > 0 || splits.length) {
      breaks.set(unit.target, { push: round(push), splits });
    }
  }
  return { breaks, headers };
}

const sameBreak = (a: PageBreak | undefined, b: PageBreak | undefined) => {
  if (!a || !b) return a === b;
  return (
    a.push === b.push &&
    a.splits.length === b.splits.length &&
    a.splits.every(
      (split, index) =>
        split.index === b.splits[index].index &&
        split.gap === b.splits[index].gap,
    )
  );
};

export const samePagination = (a: Pagination, b: Pagination) =>
  a.breaks.size === b.breaks.size &&
  [...a.breaks].every(([id, item]) => sameBreak(item, b.breaks.get(id))) &&
  a.headers.length === b.headers.length &&
  a.headers.every(
    (header, index) =>
      header.headerId === b.headers[index].headerId &&
      header.top === b.headers[index].top,
  );

/**
 * Los saltos, en un almacén con suscripción: cada componente lee solo lo
 * suyo y se vuelve a dibujar solo si cambia (con un contexto, cambiar uno
 * redibujaría todos los de la hoja). Lo de un nodo que no cambió conserva el
 * mismo objeto.
 */
export class PushStore {
  private breaks = new Map<NodeId, PageBreak>();
  private listeners = new Set<() => void>();

  getPush = (id: NodeId) => this.breaks.get(id)?.push ?? 0;

  getSplits = (id: NodeId) => this.breaks.get(id)?.splits ?? NO_SPLITS;

  /** Los saltos de ahora, para medir sin ellos. */
  current = () => this.breaks;

  set(next: Map<NodeId, PageBreak>) {
    const merged = new Map<NodeId, PageBreak>();
    next.forEach((item, id) => {
      const previous = this.breaks.get(id);
      merged.set(id, previous && sameBreak(previous, item) ? previous : item);
    });
    this.breaks = merged;
    this.listeners.forEach((listener) => listener());
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
}

export const PushStoreContext = createContext<PushStore | null>(null);

const NO_STORE = new PushStore();

/** El espacio (px) que hay que ponerle arriba al nodo para que salte de página. */
export function usePagePush(id: NodeId): number {
  const store = useContext(PushStoreContext) ?? NO_STORE;
  return useSyncExternalStore(store.subscribe, () => store.getPush(id));
}

/** Los saltos dentro de un Texto. */
export function useTextSplits(id: NodeId): TextSplit[] {
  const store = useContext(PushStoreContext) ?? NO_STORE;
  return useSyncExternalStore(store.subscribe, () => store.getSplits(id));
}

/** Marca el espacio de un salto dentro de un Texto: al medir no es texto. */
export const TEXT_GAP_ATTR = "data-page-gap";

/**
 * Un Contenedor que deja pasar a sus hijos de página en página: en columna
 * (o con un solo hijo), arrancando arriba, sin reparto automático y sin alto
 * fijo. Los demás saltan enteros.
 */
function flowsChildren(node: Node, nodes: Nodes) {
  const props = node.data.props;
  if (node.data.name !== "PdfContainer" || props.locked) return false;
  // «No partir entre páginas»: baja entero.
  if (props.keepTogether) return false;
  if (props.heightMode === "fixed" || props.gapMode === "auto") return false;
  const inFlow = node.data.nodes.filter(
    (id) =>
      nodes[id] && !nodes[id].data.hidden && !nodes[id].data.props.positionFree,
  );
  if (!inFlow.length) return false;
  if ((props.direction ?? "row") === "column")
    return (props.alignY ?? "start") === "start";
  return inFlow.length === 1;
}

/**
 * Mide lo que puede saltar de página, en su posición natural (sin los saltos
 * de ahora, `current`), en el orden de la hoja. Los libres y los ocultos no
 * saltan.
 *
 * Solo con la Hoja en columna y arrancando arriba: en fila, o repartida, bajar
 * un hijo movería a los otros.
 */
export function measurePageUnits(
  nodes: Nodes,
  pageDom: HTMLElement,
  current: Map<NodeId, PageBreak>,
): { units: PageUnit[]; page: Omit<PageBox, "height"> } | null {
  const root = nodes[ROOT_NODE];
  const rootProps = root?.data.props ?? {};
  if (
    (rootProps.direction ?? "column") !== "column" ||
    (rootProps.alignY ?? "start") !== "start" ||
    rootProps.gapMode === "auto"
  ) {
    return null;
  }
  const box = pageDom.getBoundingClientRect();
  const zoom = pageDom.offsetWidth ? box.width / pageDom.offsetWidth : 1;
  const toY = (clientY: number) => (clientY - box.top) / zoom;
  // Lo que ya bajaron los saltos de antes: se descuenta en orden.
  let applied = 0;
  const pushOf = (id: NodeId) => current.get(id)?.push ?? 0;
  const natural = (id: NodeId, dom: HTMLElement) => {
    const r = dom.getBoundingClientRect();
    const own = pushOf(id);
    const top = toY(r.top) - applied - own;
    const bottom = toY(r.bottom) - applied - own;
    applied += own;
    return { top, bottom };
  };

  const units: PageUnit[] = [];

  const textUnit = (id: NodeId, dom: HTMLElement) => {
    const r = dom.getBoundingClientRect();
    const own = pushOf(id);
    const splits = current.get(id)?.splits ?? NO_SPLITS;
    const before = applied + own;
    const totalGaps = splits.reduce((sum, split) => sum + split.gap, 0);
    applied += own + totalGaps;
    // Los trozos de texto, con el carácter en que empieza cada uno y lo que
    // lo bajan los saltos de antes dentro del Texto.
    const chunks: { node: Text; start: number; gaps: number }[] = [];
    let offset = 0;
    let gaps = 0;
    const walk = (element: Element) => {
      element.childNodes.forEach((child) => {
        if (child.nodeType === 3) {
          const text = child as Text;
          chunks.push({ node: text, start: offset, gaps });
          offset += text.length;
        } else if (child instanceof Element) {
          if (child.hasAttribute(TEXT_GAP_ATTR)) {
            gaps += Number(child.getAttribute(TEXT_GAP_ATTR)) || 0;
          } else walk(child);
        }
      });
    };
    walk(dom);
    const range = document.createRange();
    const lineAfter = (limit: number): TextLine | null => {
      for (const chunk of chunks) {
        if (!chunk.node.length) continue;
        range.selectNodeContents(chunk.node);
        const lines = Array.from(range.getClientRects());
        for (const line of lines) {
          const lineTop = toY(line.top) - before - chunk.gaps;
          const lineBottom = toY(line.bottom) - before - chunk.gaps;
          if (lineBottom <= limit + 0.5) continue;
          // El primer carácter de esa línea: el primero que no queda arriba.
          let low = 0;
          let high = chunk.node.length - 1;
          while (low < high) {
            const middle = (low + high) >> 1;
            range.setStart(chunk.node, middle);
            range.setEnd(chunk.node, middle + 1);
            const charTop =
              toY(range.getBoundingClientRect().bottom) - before - chunk.gaps;
            if (charTop <= lineTop + 0.5) low = middle + 1;
            else high = middle;
          }
          return { index: chunk.start + low, top: lineTop };
        }
      }
      return null;
    };
    units.push({
      target: id,
      top: toY(r.top) - before,
      bottom: toY(r.bottom) - before - totalGaps,
      lineAfter,
    });
  };

  const tableUnits = (id: NodeId, node: Node, dom: HTMLElement) => {
    // El encabezado no se queda solo al final de una página: salta con la
    // primera fila (salta la tabla).
    // Solo las que se ven: sin filas, la primera está pero no se dibuja.
    const rows = tableRows(nodes, id)
      .map((rowId) => ({ rowId, rowDom: nodes[rowId]?.dom }))
      .filter((row): row is { rowId: NodeId; rowDom: HTMLElement } =>
        Boolean(row.rowDom && row.rowDom.getClientRects().length > 0),
      );
    const table = natural(id, dom);
    if (!rows.length || node.data.props.rowsDirection === "row") {
      units.push({ target: id, ...table });
      return;
    }
    // El pie del grupo que termina en una fila: va con ella (lo que suma a
    // su alto).
    const footerExtent = (rowDom: HTMLElement) => {
      const footer = rowDom.parentElement?.querySelector<HTMLElement>(
        `[${GROUP_FOOTER_ATTR}]`,
      );
      if (!footer) return 0;
      return (
        (footer.getBoundingClientRect().bottom -
          rowDom.getBoundingClientRect().bottom) /
        zoom
      );
    };
    units.push({
      target: id,
      top: table.top,
      bottom:
        toY(rows[0].rowDom.getBoundingClientRect().bottom) -
        applied +
        footerExtent(rows[0].rowDom),
    });
    // Con su margen: la copia ocupa lo mismo que el original.
    const partHeight = (partId: NodeId | undefined) => {
      const part = partId ? nodes[partId] : undefined;
      if (!part?.dom || part.data.hidden) return 0;
      const style = getComputedStyle(part.dom);
      return (
        part.dom.getBoundingClientRect().height / zoom +
        (parseFloat(style.marginTop) || 0) +
        (parseFloat(style.marginBottom) || 0)
      );
    };
    const props = node.data.props;
    const gap = ((props.rowGapMm as number) ?? 0) * PX_PER_MM;
    const titleId = node.data.linkedNodes[TABLE_PARTS.title];
    const headerId = node.data.linkedNodes[TABLE_PARTS.header];
    // Lo que se repite arriba de cada página en que sigue: el título (si se
    // muestra y se repite) y el encabezado («Repetir en cada página»).
    const parts: { id: NodeId; height: number; suffix?: string }[] = [];
    const titleHeight =
      props.showTitle && props.titleRepeat !== "none" ? partHeight(titleId) : 0;
    if (titleId && titleHeight > 0)
      parts.push({
        id: titleId,
        height: titleHeight + gap,
        // Con un texto al final («(continuación)» u otro), separado por un espacio.
        suffix:
          props.titleRepeat === "continued" &&
          String(props.titleRepeatText ?? "(continuación)").trim()
            ? ` ${String(props.titleRepeatText ?? "(continuación)").trim()}`
            : undefined,
      });
    const headerHeight =
      props.repeatHeader !== false ? partHeight(headerId) : 0;
    if (headerId && headerHeight > 0)
      parts.push({ id: headerId, height: headerHeight + gap });
    const repeatHeader = {
      parts,
      height: parts.reduce((sum, part) => sum + part.height, 0),
    };
    for (const { rowId, rowDom } of rows.slice(1)) {
      // La primera fila de otro grupo: baja junto con su título y su
      // encabezado (GroupHeading), sin copias encima.
      const heading = dom.querySelector<HTMLElement>(
        `[${GROUP_HEADING_ATTR}="${rowId}"]`,
      );
      if (heading) {
        const key = groupPushKey(rowId);
        const own = pushOf(key);
        const top = toY(heading.getBoundingClientRect().top) - applied - own;
        const bottom =
          toY(rowDom.getBoundingClientRect().bottom) -
          applied -
          own +
          footerExtent(rowDom);
        applied += own;
        units.push({ target: key, top, bottom });
        continue;
      }
      // Las demás: si saltan, la copia del título dice el nombre de su grupo.
      // Y la del encabezado, sin las columnas que oculta su grupo.
      const group = rowDom.parentElement?.getAttribute(GROUP_NAME_ATTR);
      const hiddenAttr = rowDom.parentElement?.getAttribute(GROUP_HIDDEN_ATTR);
      const hiddenColumns =
        hiddenAttr === null || hiddenAttr === undefined
          ? undefined
          : hiddenAttr.split(",").filter(Boolean).map(Number);
      const place = natural(rowId, rowDom);
      units.push({
        target: rowId,
        top: place.top,
        bottom: place.bottom + footerExtent(rowDom),
        repeatHeader:
          props.groupBy && group !== null && group !== undefined
            ? {
                ...repeatHeader,
                parts: repeatHeader.parts.map((part) =>
                  part.id === titleId
                    ? { ...part, text: group }
                    : part.id === headerId && hiddenColumns
                      ? { ...part, hiddenColumns }
                      : part,
                ),
              }
            : repeatHeader,
      });
    }
  };

  const flow = (childIds: NodeId[]) => {
    for (const childId of childIds) {
      const child = nodes[childId];
      const dom = child?.dom;
      // El encabezado y el pie de página van aparte (lib/page-zones).
      if (
        !child ||
        !dom ||
        child.data.hidden ||
        child.data.props.positionFree ||
        child.data.props.pageZone
      )
        continue;
      if (child.data.name === DATA_TABLE_NAME) tableUnits(childId, child, dom);
      else if (child.data.name === "PdfText") textUnit(childId, dom);
      else if (flowsChildren(child, nodes)) {
        // Sus hijos saltan por su cuenta; él no lleva espacio propio.
        applied += pushOf(childId);
        flow(child.data.nodes);
      } else units.push({ target: childId, ...natural(childId, dom) });
    }
  };
  flow(root.data.nodes);

  const style = getComputedStyle(pageDom);
  const px = (value: string) => parseFloat(value) || 0;
  return {
    units,
    page: {
      marginTop: px(style.paddingTop) + px(style.borderTopWidth),
      marginBottom: px(style.paddingBottom) + px(style.borderBottomWidth),
    },
  };
}
