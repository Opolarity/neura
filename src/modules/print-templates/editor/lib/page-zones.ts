import { createContext } from "react";
import { ROOT_NODE, type NodeId, type Nodes } from "@craftjs/core";
import type { Sides } from "./units";

/**
 * Encabezado y pie de página, como en Word: dos Contenedores de la Hoja (solo
 * con varias páginas) que salen arriba y abajo de cada página. El de verdad
 * va en la primera página en que sale y en las demás se dibuja una copia
 * (components/header-copies); el contenido de cada página se reparte en el
 * espacio que le dejan (lib/pagination).
 *
 * Se agregan y se quitan desde la Hoja: no se borran, mueven ni copian.
 * Cada uno dice en qué páginas sale, como las secciones de Word: en todas,
 * desde una, solo en una o en un rango (la guía de remisión de hoy lleva
 * «… (cont.)» desde la segunda).
 */

export type PageZone = "" | "header" | "footer";

export const PAGE_ZONE_LABEL: Record<Exclude<PageZone, "">, string> = {
  header: "Encabezado de página",
  footer: "Pie de página",
};

/** En qué páginas sale una zona (números de página desde 1). */
export interface ZonePages {
  mode: "all" | "from" | "only" | "range";
  /** «Desde», «Solo en» y el principio del rango. */
  from: number;
  /** El final del rango. */
  to: number;
}

export const ALL_PAGES: ZonePages = { mode: "all", from: 1, to: 1 };

/** Las páginas de una zona, completas (lo guardado puede venir a medias). */
export const zonePagesOf = (value: unknown): ZonePages => {
  const raw = (value ?? {}) as Partial<ZonePages>;
  const mode =
    raw.mode === "from" || raw.mode === "only" || raw.mode === "range"
      ? raw.mode
      : "all";
  const from = Math.max(1, Math.round(Number(raw.from) || 1));
  const to = Math.max(from, Math.round(Number(raw.to) || from));
  return { mode, from, to };
};

/** Si una zona sale en una página (índice desde 0). */
export const zoneOnPage = (pages: ZonePages, index: number) => {
  const page = index + 1;
  if (pages.mode === "all") return true;
  if (pages.mode === "from") return page >= pages.from;
  if (pages.mode === "only") return page === pages.from;
  return page >= pages.from && page <= pages.to;
};

/** La primera página en que sale (índice desde 0): ahí va la de verdad. */
export const zoneFirstPage = (pages: ZonePages) =>
  pages.mode === "all" ? 0 : pages.from - 1;

/** Lo de la Hoja que necesitan sus zonas para colocarse. */
export interface PageZoneLayout {
  /** El margen interior de la Hoja, en mm. */
  padding: Sides;
  headerPages: ZonePages;
  footerPages: ZonePages;
}

/** Lo da la Hoja a sus hijos: dónde va cada zona. */
export const PageZoneContext = createContext<PageZoneLayout | null>(null);

/** Cuántas páginas tiene la hoja (components/paper-canvas). */
export const PageCountContext = createContext(1);

/** El Contenedor de una zona en la Hoja, si lo tiene (oculto o no). */
export const pageZoneId = (
  nodes: Nodes,
  zone: Exclude<PageZone, "">,
): NodeId | undefined =>
  nodes[ROOT_NODE]?.data.nodes.find(
    (id) => nodes[id]?.data.props.pageZone === zone,
  );

/** Las props de una zona nueva: a lo ancho, del alto de lo que lleva. */
export const pageZoneProps = (zone: Exclude<PageZone, "">) => ({
  pageZone: zone,
  direction: "column" as const,
  widthMode: "fill" as const,
  heightMode: "hug" as const,
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  background: "rgba(255, 255, 255, 0)",
});

/** Marca la etiqueta de la zona en el editor: las copias no la llevan. */
export const ZONE_LABEL_ATTR = "data-page-zone-label";
