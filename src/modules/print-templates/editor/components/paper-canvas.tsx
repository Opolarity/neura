import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { ROOT_NODE, useEditor, type NodeId } from "@craftjs/core";
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import { AUTO_PAPER_MIN_HEIGHT_MM } from "../../constants/systemPrintTemplates";
import type { PaperHeight } from "../../types/printTemplates.types";
import { PX_PER_MM, mm } from "../lib/units";
import { ZOOM_STEP, clampZoom, stepZoom } from "../lib/zoom";
import { NODE_ATTRIBUTE } from "../lib/use-editable-node";
import {
  EMPTY_PAGINATION,
  measurePageUnits,
  paginate,
  PushStore,
  PushStoreContext,
  samePagination,
  type HeaderCopy,
  type Pagination,
} from "../lib/pagination";
import { writePageNumbers } from "../lib/document-values";
import {
  PageCountContext,
  pageZoneId,
  zoneFirstPage,
  zoneOnPage,
  zonePagesOf,
  type ZonePages,
} from "../lib/page-zones";
import { SelectionOverlay } from "./selection-overlay";
import { HeaderCopies } from "./header-copies";
import { NodeMenuContent } from "./node-context-menu";

// Aire alrededor de la hoja al ajustarla a la pantalla.
const FIT_MARGIN_PX = 64;

/** Hasta dónde (px de pantalla) llega el velo de fuera de la hoja. */
const OUTSIDE_VEIL_PX = 4000;

/** Alto (px de pantalla) de la separación entre una página y la siguiente. */
const PAGE_GAP_PX = 16;

/** Cuánto tapa el velo: lo de fuera se ve al 30 %. */
const OUTSIDE_VEIL_OPACITY = 0.7;

/**
 * Cuánto desplazamiento de la rueda hace un paso de zoom. Un clic de la rueda
 * del mouse ya lo supera; el del touchpad, que llega en trocitos, se acumula.
 */
const WHEEL_DELTA_PER_STEP = 50;

/** El encabezado y el pie de página medidos (lib/page-zones). */
interface MeasuredZone {
  id: NodeId;
  height: number;
  pages: ZonePages;
}

interface PageZones {
  header: MeasuredZone | null;
  footer: MeasuredZone | null;
  marginTop: number;
  marginBottom: number;
}

const NO_ZONES: PageZones = {
  header: null,
  footer: null,
  marginTop: 0,
  marginBottom: 0,
};

const sameZone = (a: PageZones["header"], b: PageZones["header"]) =>
  a === b ||
  (a !== null &&
    b !== null &&
    a.id === b.id &&
    a.height === b.height &&
    JSON.stringify(a.pages) === JSON.stringify(b.pages));

const sameZones = (a: PageZones, b: PageZones) =>
  sameZone(a.header, b.header) &&
  sameZone(a.footer, b.footer) &&
  a.marginTop === b.marginTop &&
  a.marginBottom === b.marginBottom;

/** Marca el elemento de la hoja (el papel), para reconocer los clics en ella. */
export const PAPER_ATTR = "data-print-paper";

/**
 * La hoja a escala. Mide W mm × H mm en unidades CSS, así al 100% es el
 * tamaño real; el zoom (lo maneja la barra superior) la escala con transform
 * sin cambiar sus medidas, y una caja exterior con el tamaño ya escalado hace
 * que el scroll cuadre.
 *
 * Con alto automático (papel de rollo) la hoja crece con lo que lleva dentro,
 * desde AUTO_PAPER_MIN_HEIGHT_MM, y hasta el borde inferior del componente
 * libre que quede más abajo (los libres no ocupan sitio en el reparto); se
 * ajusta a la pantalla por el ancho y se desplaza hacia abajo.
 *
 * Con varias páginas la hoja crece de página en página (el alto de una más
 * otra…) hasta que entra todo, con una separación entre una página y la
 * siguiente. Lo que quedaría partido por el final de una página baja entero a
 * la siguiente, como en Word, y una Tabla de datos sigue en la página nueva
 * por filas, con una copia de su encabezado (lib/pagination).
 *
 * Un clic en el fondo, fuera de la hoja, selecciona la Hoja. Ctrl + rueda
 * sobre el lienzo acerca o aleja, con el punto bajo el puntero quieto. El
 * clic derecho en la hoja selecciona lo que hay debajo y abre su menú, el
 * mismo de la Estructura; en la Hoja misma no hay menú.
 */
export function PaperCanvas({
  widthMm,
  heightMm,
  multiPage,
  scale,
  interactive,
  onZoomChange,
  onFitZoomChange,
  children,
}: {
  widthMm: number;
  heightMm: PaperHeight;
  /** Lo que no entra sigue en otra hoja igual (solo con alto fijo). */
  multiPage: boolean;
  scale: number;
  /** En vista previa no: el clic en el fondo no selecciona la Hoja. */
  interactive: boolean;
  /** Ctrl + rueda: el zoom nuevo. */
  onZoomChange: (zoom: number) => void;
  /** El zoom que deja la hoja entera a la vista; cambia con la ventana. */
  onFitZoomChange: (zoom: number) => void;
  children: ReactNode;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const { actions, query, pageDom, layoutKey } = useEditor((state) => {
    const root = state.nodes[ROOT_NODE];
    return {
      pageDom: root?.dom ?? null,
      // Lo que cambia los saltos sin cambiar lo que se ve de inmediato (como
      // «Repetir en cada página» de una Tabla, o las páginas del encabezado):
      // al cambiar, se vuelve a paginar.
      layoutKey: JSON.stringify([
        root?.data.props.headerPages,
        root?.data.props.footerPages,
        Object.values(state.nodes)
          .filter((node) => node.data.props.repeatHeader !== undefined)
          .map((node) => [
            node.data.props.showTitle,
            node.data.props.titleRepeat,
            node.data.props.titleRepeatText,
            node.data.props.groupBy,
            node.data.props.showGroupFooter,
            node.data.props.repeatHeader,
            node.data.props.showHeader,
          ]),
      ]),
    };
  });
  const autoHeight = heightMm === "auto";
  // El alto de una página, con varias páginas.
  const pageHeightPx =
    multiPage && heightMm !== "auto" ? heightMm * PX_PER_MM : null;
  // La hoja crece con su contenido: alto automático o varias páginas.
  const growing = autoHeight || pageHeightPx !== null;

  // Alto de la hoja sin escalar, en px. Si crece, se mide: la caja exterior
  // lo necesita para que el scroll cuadre.
  const [measuredHeightPx, setMeasuredHeightPx] = useState(
    AUTO_PAPER_MIN_HEIGHT_MM * PX_PER_MM,
  );
  const paperHeightPx =
    heightMm === "auto" || growing ? measuredHeightPx : heightMm * PX_PER_MM;

  useEffect(() => {
    const paper = paperRef.current;
    if (!growing || !paper) return;
    const observer = new ResizeObserver(() =>
      setMeasuredHeightPx(paper.offsetHeight),
    );
    observer.observe(paper);
    return () => observer.disconnect();
  }, [growing]);

  // Si la hoja crece, hasta dónde llega el libre más bajo: px sin escalar
  // desde arriba de la hoja, con el borde inferior de la Hoja. Con varias
  // páginas, también hasta dónde llega lo de dentro (con el margen interior
  // de abajo): la Hoja rellena la hoja, así que su alto no lo dice. Se mide de
  // nuevo cada vez que algo cambia dentro de la Hoja.
  const [freeBottomPx, setFreeBottomPx] = useState(0);
  const [contentBottomPx, setContentBottomPx] = useState(0);
  // Los saltos de página: los empujones van a un almacén que cada componente
  // lee por su cuenta; las copias de encabezado se dibujan aquí.
  const [pushStore] = useState(() => new PushStore());
  const paginationRef = useRef<Pagination>(EMPTY_PAGINATION);
  const [headerCopies, setHeaderCopies] = useState<HeaderCopy[]>([]);
  // Los Textos de número de página: cada uno, el de la página en que cae
  // (lib/document-values). El total, el de ahora (pageCountRef).
  const pageCountRef = useRef(1);
  const numberPages = useCallback(() => {
    const paper = paperRef.current;
    if (!paper) return;
    const box = paper.getBoundingClientRect();
    const zoom = paper.offsetWidth ? box.width / paper.offsetWidth : 1;
    writePageNumbers(
      paper,
      (element) =>
        pageHeightPx
          ? Math.floor(
              (element.getBoundingClientRect().top - box.top) /
                zoom /
                pageHeightPx,
            ) + 1
          : 1,
      pageCountRef.current,
    );
  }, [pageHeightPx]);
  // El encabezado y el pie de página: su alto, desde qué página salen y el
  // margen de la Hoja, para reservar su espacio y copiarlos (lib/page-zones).
  const [zones, setZones] = useState<PageZones>(NO_ZONES);
  useEffect(() => {
    if (!growing || !pageDom) return;
    const measureZones = (): PageZones => {
      const nodes = query.getNodes();
      const rootProps = nodes[ROOT_NODE]?.data.props ?? {};
      const box = pageDom.getBoundingClientRect();
      const zoom = pageDom.offsetWidth ? box.width / pageDom.offsetWidth : 1;
      const of = (kind: "header" | "footer") => {
        const id = pageZoneId(nodes, kind);
        const node = id ? nodes[id] : undefined;
        if (!id || !node?.dom || node.data.hidden) return null;
        return {
          id,
          height: Math.round(node.dom.getBoundingClientRect().height / zoom),
          pages: zonePagesOf(
            kind === "header" ? rootProps.headerPages : rootProps.footerPages,
          ),
        };
      };
      const style = getComputedStyle(pageDom);
      return {
        header: of("header"),
        footer: of("footer"),
        marginTop: parseFloat(style.paddingTop) || 0,
        marginBottom: parseFloat(style.paddingBottom) || 0,
      };
    };
    const repaginate = () => {
      const nextZones = pageHeightPx ? measureZones() : NO_ZONES;
      setZones((current) =>
        sameZones(current, nextZones) ? current : nextZones,
      );
      const measured = pageHeightPx
        ? measurePageUnits(query.getNodes(), pageDom, pushStore.current())
        : null;
      const next =
        measured && pageHeightPx
          ? paginate(measured.units, {
              height: pageHeightPx,
              ...measured.page,
              header: nextZones.header,
              footer: nextZones.footer,
            })
          : EMPTY_PAGINATION;
      if (samePagination(next, paginationRef.current)) return;
      paginationRef.current = next;
      pushStore.set(next.breaks);
      setHeaderCopies(next.headers);
    };
    const measure = () => {
      repaginate();
      const page = pageDom.getBoundingClientRect();
      const zoom = pageDom.offsetWidth ? page.width / pageDom.offsetWidth : 1;
      let bottom = 0;
      for (const node of Object.values(query.getNodes())) {
        if (!node.data.props.positionFree || !node.dom) continue;
        bottom = Math.max(
          bottom,
          (node.dom.getBoundingClientRect().bottom - page.top) / zoom,
        );
      }
      const borderBottom =
        pageDom.offsetHeight - pageDom.clientTop - pageDom.clientHeight;
      setFreeBottomPx(
        bottom > 0 ? Math.round((bottom + borderBottom) * 10) / 10 : 0,
      );
      let content = 0;
      for (const childId of query.node(ROOT_NODE).get()?.data.nodes ?? []) {
        const child = query.node(childId).get();
        const dom = child?.dom;
        // El encabezado y el pie no cuentan: van en su lugar de cada página.
        if (!dom || child.data.props.pageZone) continue;
        content = Math.max(
          content,
          (dom.getBoundingClientRect().bottom - page.top) / zoom,
        );
      }
      const paddingBottom = parseFloat(getComputedStyle(pageDom).paddingBottom);
      // La última página lleva también su pie.
      const footerId = pageZoneId(query.getNodes(), "footer");
      const footer = footerId ? query.node(footerId).get() : undefined;
      const footerHeight =
        footer?.dom && !footer.data.hidden
          ? footer.dom.getBoundingClientRect().height / zoom
          : 0;
      setContentBottomPx(
        Math.round(
          (content + (paddingBottom || 0) + borderBottom + footerHeight) * 10,
        ) / 10,
      );
      numberPages();
    };
    measure();
    // Una medición por cuadro aunque lleguen muchos cambios seguidos.
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(pageDom);
    const mutationObserver = new MutationObserver(schedule);
    mutationObserver.observe(pageDom, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["style"],
    });
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [
    growing,
    pageDom,
    query,
    pageHeightPx,
    pushStore,
    layoutKey,
    numberPages,
  ]);

  // Con varias páginas: cuántas hacen falta para que entre todo. Un
  // encabezado o pie que sale desde una página que todavía no hay no la crea:
  // aparece cuando el contenido llega a ella, como en Word.
  const pageCount = pageHeightPx
    ? Math.max(
        1,
        Math.ceil(
          (Math.max(contentBottomPx, freeBottomPx) - 0.5) / pageHeightPx,
        ),
      )
    : 1;
  pageCountRef.current = pageCount;
  useEffect(() => {
    numberPages();
  }, [pageCount, numberPages]);

  // Las copias del encabezado y del pie: en cada página en que salen, menos
  // en la primera (ahí va el de verdad).
  const zoneCopies = useMemo<HeaderCopy[]>(() => {
    if (!pageHeightPx) return [];
    const copies: HeaderCopy[] = [];
    for (let page = 0; page < pageCount; page++) {
      const { header, footer } = zones;
      if (
        header &&
        page !== zoneFirstPage(header.pages) &&
        zoneOnPage(header.pages, page)
      )
        copies.push({
          headerId: header.id,
          top: page * pageHeightPx + zones.marginTop,
          page: page + 1,
        });
      if (
        footer &&
        page !== zoneFirstPage(footer.pages) &&
        zoneOnPage(footer.pages, page)
      )
        copies.push({
          headerId: footer.id,
          top: (page + 1) * pageHeightPx - zones.marginBottom - footer.height,
          page: page + 1,
        });
    }
    return copies;
  }, [zones, pageCount, pageHeightPx]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const measure = () => {
      const width =
        (viewport.clientWidth - FIT_MARGIN_PX) / (widthMm * PX_PER_MM);
      // Con alto automático solo cuenta el ancho: un ticket largo quedaría
      // diminuto.
      const height =
        heightMm === "auto"
          ? Infinity
          : (viewport.clientHeight - FIT_MARGIN_PX) / (heightMm * PX_PER_MM);
      onFitZoomChange(clampZoom(Math.min(width, height)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [widthMm, heightMm, onFitZoomChange]);

  // El punto de la hoja bajo el puntero (en fracción de su ancho y alto) y
  // dónde estaba el puntero, para dejarlo en el mismo sitio tras el zoom.
  const anchorRef = useRef<{
    clientX: number;
    clientY: number;
    fx: number;
    fy: number;
  } | null>(null);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const onZoomChangeRef = useRef(onZoomChange);
  onZoomChangeRef.current = onZoomChange;

  // Nativo y no pasivo: hay que impedir el zoom del navegador.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    let accumulated = 0;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      accumulated += event.deltaY;
      if (Math.abs(accumulated) < WHEEL_DELTA_PER_STEP) return;
      const delta = accumulated < 0 ? ZOOM_STEP : -ZOOM_STEP;
      accumulated = 0;
      const next = stepZoom(scaleRef.current, delta);
      if (next === scaleRef.current) return;
      const paper = paperRef.current?.getBoundingClientRect();
      anchorRef.current = paper
        ? {
            clientX: event.clientX,
            clientY: event.clientY,
            fx: (event.clientX - paper.left) / paper.width,
            fy: (event.clientY - paper.top) / paper.height,
          }
        : null;
      onZoomChangeRef.current(next);
    };
    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, []);

  // El nodo del último clic derecho en la hoja: el del menú. Cada clic
  // derecho lo monta de nuevo (`key`): si ya estaba abierto, o cerrándose,
  // Radix lo reabriría en el mismo sitio en vez de ir al clic.
  const [menu, setMenu] = useState<{ id: NodeId; key: number }>({
    id: ROOT_NODE,
    key: 0,
  });
  const onPaperContextMenu = (event: ReactMouseEvent) => {
    if (!interactive) return;
    const target = event.target instanceof Element ? event.target : null;
    const element = target?.closest(`[${NODE_ATTRIBUTE}]`);
    const id =
      Object.entries(query.getNodes()).find(
        ([, node]) => node.dom === element,
      )?.[0] ?? ROOT_NODE;
    actions.selectNode(id);
    // La Hoja no tiene menú: no se copia, duplica ni borra. Sin el del
    // navegador tampoco (Radix no abre si ya está prevenido).
    if (id === ROOT_NODE || query.node(id).get().data.props.isPage) {
      event.preventDefault();
      return;
    }
    setMenu((current) => ({ id, key: current.key + 1 }));
  };

  // Ya con la hoja a la escala nueva: el scroll devuelve ese punto al puntero.
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    anchorRef.current = null;
    const viewport = viewportRef.current;
    const paper = paperRef.current?.getBoundingClientRect();
    if (!anchor || !viewport || !paper) return;
    viewport.scrollLeft +=
      paper.left + anchor.fx * paper.width - anchor.clientX;
    viewport.scrollTop += paper.top + anchor.fy * paper.height - anchor.clientY;
  }, [scale]);

  return (
    <div className="relative flex-1 min-w-0 min-h-0 bg-muted">
      <div
        ref={viewportRef}
        className="absolute inset-0 overflow-auto"
        onMouseDown={(e) => {
          if (interactive && !paperRef.current?.contains(e.target as Node)) {
            actions.selectNode(ROOT_NODE);
          }
        }}
      >
        <div className="flex min-w-full min-h-full w-max p-8">
          <div
            className="m-auto shrink-0"
            style={{
              width: widthMm * PX_PER_MM * scale,
              height: paperHeightPx * scale,
            }}
          >
            {/* La hoja es papel: blanca en cualquier tema. Lo que se sale de
                ella se ve, pero atenuado: no se imprime. */}
            <ContextMenu>
              <ContextMenuTrigger asChild disabled={!interactive}>
                <div
                  ref={paperRef}
                  onContextMenu={onPaperContextMenu}
                  {...{ [PAPER_ATTR]: "" }}
                  className="relative bg-white shadow-md"
                  style={{
                    width: mm(widthMm),
                    // Con alto automático el papel es una columna que la Hoja
                    // rellena: crece con su contenido y llena el mínimo.
                    ...(heightMm === "auto"
                      ? {
                          display: "flex",
                          flexDirection: "column",
                          minHeight: Math.max(
                            AUTO_PAPER_MIN_HEIGHT_MM * PX_PER_MM,
                            freeBottomPx,
                          ),
                        }
                      : pageHeightPx
                        ? // Varias páginas: tantas como hagan falta.
                          {
                            display: "flex",
                            flexDirection: "column",
                            minHeight: pageCount * pageHeightPx,
                          }
                        : { height: mm(heightMm) }),
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                  }}
                >
                  <PushStoreContext.Provider value={pushStore}>
                    <PageCountContext.Provider value={pageCount}>
                      {children}
                    </PageCountContext.Provider>
                  </PushStoreContext.Provider>
                  {pageHeightPx && (
                    <HeaderCopies
                      copies={[...headerCopies, ...zoneCopies]}
                      pageCount={pageCount}
                    />
                  )}
                  {/* Un velo del color del fondo sobre todo lo que queda fuera
                      de la hoja: una sombra sin desenfoque alrededor de una
                      caja del tamaño de la hoja. La sombra no agranda el
                      scroll y no recibe clics. */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-10"
                    style={{
                      boxShadow: `0 0 0 ${Math.ceil(OUTSIDE_VEIL_PX / scale)}px hsl(var(--muted) / ${OUTSIDE_VEIL_OPACITY})`,
                    }}
                  />
                  {/* Entre una página y la siguiente, una separación del color
                      del fondo, como entre dos hojas, centrada donde empieza
                      la página (lo que queda debajo se ve atenuado, como lo de
                      fuera de la hoja), con su número fuera. No se imprime. */}
                  {pageHeightPx &&
                    Array.from({ length: pageCount - 1 }, (_, index) => {
                      const gap = PAGE_GAP_PX / scale;
                      const edge = `${2 / scale}px ${4 / scale}px rgb(0 0 0 / 0.12)`;
                      return (
                        <div
                          key={index}
                          aria-hidden
                          className="pointer-events-none absolute inset-x-0 z-10"
                          style={{
                            top: (index + 1) * pageHeightPx - gap / 2,
                            height: gap,
                            background: `hsl(var(--muted) / 0.9)`,
                            // El borde de cada hoja: abajo la de arriba y
                            // arriba la de abajo.
                            boxShadow: `inset 0 ${edge}, inset 0 -${edge}`,
                          }}
                        >
                          <span
                            className="absolute left-full top-1/2 -translate-y-1/2 whitespace-nowrap text-muted-foreground"
                            style={{
                              marginLeft: 8 / scale,
                              fontSize: 11 / scale,
                            }}
                          >
                            Página {index + 2}
                          </span>
                        </div>
                      );
                    })}
                  {interactive && <SelectionOverlay paperRef={paperRef} />}
                </div>
              </ContextMenuTrigger>
              <NodeMenuContent key={menu.key} id={menu.id} />
            </ContextMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
