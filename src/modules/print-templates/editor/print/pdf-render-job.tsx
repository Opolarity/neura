import { useEffect, useRef, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";
import {
  Editor,
  Frame,
  ROOT_NODE,
  useEditor,
  type NodeId,
  type Nodes,
} from "@craftjs/core";
import type jsPDF from "jspdf";
import { TooltipProvider } from "@/components/ui/tooltip";
import type {
  PrintDataSource,
  PrintDataSourceId,
} from "../../constants/printDataSources";
import {
  PrintDataContext,
  rowsOf,
  usePrintData,
  type PrintData,
} from "../lib/print-data";
import { printTemplateResolver } from "../lib/resolver";
import { PaperContext, type Paper } from "../lib/paper-context";
import { DATA_TABLE_NAME, DataSourcesContext } from "../lib/data-table";
import { NodeActionsProvider } from "../lib/node-actions";
import { PX_PER_MM } from "../lib/units";
import { PaperCanvas, PAPER_ATTR } from "../components/paper-canvas";
import { HEADER_COPY_ATTR } from "../components/header-copies";
import {
  composePdf,
  drawPages,
  drawToPdf,
  type LogicalPage,
} from "./draw-to-pdf";

/** Lo más que se espera a que la hoja termine de armarse (ms). */
const READY_TIMEOUT_MS = 5000;

/**
 * El siguiente cuadro; si la pestaña queda en segundo plano (el navegador no
 * da cuadros ahí), a más tardar en 50 ms.
 */
const nextFrame = () =>
  new Promise<void>((resolve) => {
    const timer = window.setTimeout(resolve, 50);
    requestAnimationFrame(() => {
      window.clearTimeout(timer);
      resolve();
    });
  });

/**
 * Espera a que la hoja deje de cambiar: las filas de las tablas, los saltos
 * de página, las imágenes y los QR (que se generan aparte). Lista cuando su
 * alto y sus imágenes no cambian en varios cuadros seguidos.
 */
async function waitUntilSettled(paper: HTMLElement, frames = 6) {
  await document.fonts.ready;
  const started = performance.now();
  let previous = "";
  let stableFrames = 0;
  while (performance.now() - started < READY_TIMEOUT_MS) {
    await nextFrame();
    const images = Array.from(paper.querySelectorAll("img"));
    const signature = `${paper.offsetHeight}|${images.length}|${images.every((img) => img.complete)}`;
    if (signature === previous && images.every((img) => img.complete))
      stableFrames++;
    else stableFrames = 0;
    previous = signature;
    if (stableFrames >= frames) return;
  }
}

/** Lo más que se espera a que la hoja termine de armarse antes de apagar (ms). */
const DISABLE_TIMEOUT_MS = 3000;

/** Con un documento de verdad, lo más que se espera (más filas que armar). */
const DISABLE_TIMEOUT_DATA_MS = 20000;

/**
 * Si la hoja ya está armada: cada componente que se dibuja tiene su elemento
 * (los ocultos y lo que va dentro de ellos no se dibujan) y cada Tabla de
 * datos ya tiene sus filas: las de ejemplo o, al imprimir, las del documento
 * (las agrega o quita después de dibujarse).
 */
const sheetReady = (nodes: Nodes, data: PrintData | null) => {
  if (!nodes[ROOT_NODE]?.dom) return false;
  const hidden = (id: NodeId | null | undefined): boolean => {
    for (let current = id; current; current = nodes[current]?.data.parent)
      if (nodes[current]?.data.hidden) return true;
    return false;
  };
  return Object.entries(nodes).every(([id, node]) => {
    if (hidden(id)) return true;
    if (!node.dom) return false;
    if (node.data.name !== DATA_TABLE_NAME) return true;
    const real = rowsOf(data, node.data.props.source as PrintDataSourceId);
    if (real) return node.data.nodes.length === Math.max(0, real.length - 1);
    const rows = Math.max(1, Number(node.data.props.sampleRows) || 1);
    return node.data.nodes.length + 1 >= Math.min(rows, MAX_TABLE_ROWS);
  });
};

/** El tope de filas de ejemplo de una Tabla (components/pdf-data-table). */
const MAX_TABLE_ROWS = 40;

/**
 * Apaga el editor cuando la hoja está armada. Arranca encendido porque
 * craft solo registra el elemento de cada componente (node.dom) con el
 * editor encendido, y sin ellos no hay saltos de página: el PDF salía en una
 * sola página. Se espera a todo (también a las filas que una Tabla agrega
 * después de dibujarse): apagado antes, lo que llega tarde no se registra y
 * la página no se parte bien. Apagado, todo se ve como se imprime.
 */
export function DisableWhenMounted({
  onDisabled,
}: {
  onDisabled?: () => void;
}) {
  const data = usePrintData();
  const { actions, ready } = useEditor((state) => ({
    ready: sheetReady(state.nodes, data),
  }));
  const done = useRef(false);
  const disable = useRef<() => void>(() => undefined);
  disable.current = () => {
    if (done.current) return;
    done.current = true;
    actions.setOptions((options) => {
      options.enabled = false;
    });
    onDisabled?.();
  };
  useEffect(() => {
    if (ready) disable.current();
  }, [ready]);
  // Por si algo nunca llega a tener su elemento: se apaga igual.
  useEffect(() => {
    const timer = window.setTimeout(
      () => disable.current(),
      data ? DISABLE_TIMEOUT_DATA_MS : DISABLE_TIMEOUT_MS,
    );
    return () => window.clearTimeout(timer);
  }, [data]);
  return null;
}

/**
 * Arma una plantilla fuera de la vista, con las mismas piezas del editor (sin
 * edición, a escala 1) y la dibuja en un PDF (draw-to-pdf). Se monta, entrega
 * el PDF por `onDone` y quien la montó la quita.
 */
export function PdfRenderJob({
  content,
  design,
  data,
  paper,
  dataSources,
  onDone,
  onError,
  onProgress,
}: {
  /** El diseño serializado de craft (una plantilla guardada). */
  content?: string;
  /** O el de una plantilla del sistema (editor/designs), sin serializar. */
  design?: ReactElement;
  /**
   * Los datos del documento; sin ellos, los de ejemplo. Una lista: un
   * registro tras otro (cada uno, sus páginas), juntos en un PDF: las
   * etiquetas o los tickets de varias cosas, repartidos en las columnas.
   */
  data?: PrintData | readonly PrintData[];
  /** Con una lista: cuántos registros van armados. */
  onProgress?: (done: number, total: number) => void;
  paper: Paper;
  dataSources: readonly PrintDataSource[];
  onDone: (doc: jsPDF) => void;
  onError: (error: unknown) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  // Con una lista, el registro que se arma ahora; se avanza cuando el
  // anterior ya está dibujado.
  const records = useRef(Array.isArray(data) ? data : null).current;
  const [recordIndex, setRecordIndex] = useState(0);
  const shown = useRef<() => void>();
  useEffect(() => {
    shown.current?.();
  }, [recordIndex]);
  const showRecord = (index: number) =>
    new Promise<void>((resolve) => {
      shown.current = resolve;
      setRecordIndex(index);
    });
  const current = records
    ? (records[recordIndex] ?? null)
    : ((data as PrintData | undefined) ?? null);
  // Las medidas con que arrancó: la hoja se arma una sola vez.
  const paperRef = useRef(paper);
  // Cuando el editor ya se apagó (DisableWhenMounted).
  const disabled = useRef<{ promise: Promise<void>; resolve: () => void }>();
  if (!disabled.current) {
    let resolve = () => undefined as void;
    const promise = new Promise<void>((done) => {
      resolve = done;
    });
    disabled.current = { promise, resolve };
  }
  const onDisabled = useRef(() => disabled.current?.resolve()).current;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await disabled.current?.promise;
        await nextFrame();
        const paperDom = hostRef.current?.querySelector<HTMLElement>(
          `[${PAPER_ATTR}]`,
        );
        const sheet = paperDom?.firstElementChild as HTMLElement | null;
        if (!paperDom || !sheet) throw new Error("No se pudo armar la hoja.");
        await waitUntilSettled(paperDom);
        if (cancelled) return;
        const paper = paperRef.current;
        // La hoja como está ahora (con alto automático, su alto cambia).
        const layout = () => {
          const heightMm = paperDom.offsetHeight / PX_PER_MM;
          const pageHeightMm =
            paper.heightMm === "auto" ? heightMm : paper.heightMm;
          return {
            paper: paperDom,
            roots: [
              sheet,
              ...Array.from(
                paperDom.querySelectorAll<HTMLElement>(`[${HEADER_COPY_ATTR}]`),
              ),
            ],
            widthMm: paper.widthMm,
            pageHeightMm,
            pageCount: paper.multiPage
              ? Math.max(1, Math.round(heightMm / pageHeightMm))
              : 1,
            imposition: paper.imposition,
          };
        };
        if (!records) {
          const doc = await drawToPdf(layout());
          if (!cancelled) onDoneRef.current(doc);
          return;
        }
        // Un registro tras otro: se cambian los datos y, cuando la hoja
        // vuelve a quedarse quieta, se dibujan sus páginas.
        const pages: LogicalPage[] = [];
        for (let index = 0; index < records.length; index++) {
          if (index > 0) {
            await showRecord(index);
            await waitUntilSettled(paperDom, 2);
          }
          if (cancelled) return;
          pages.push(...(await drawPages(layout())));
          onProgressRef.current?.(index + 1, records.length);
        }
        const doc = composePdf(pages, {
          widthMm: paper.widthMm,
          imposition: paper.imposition,
          spread: true,
        });
        if (!cancelled) onDoneRef.current(doc);
      } catch (error) {
        if (!cancelled) onErrorRef.current(error);
      }
    })();
    return () => {
      cancelled = true;
    };
    // La hoja se arma una sola vez, con lo que llegó al montarse.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    // Fuera de la vista, pero con su tamaño: el navegador la acomoda igual.
    <div
      ref={hostRef}
      aria-hidden
      className="pointer-events-none fixed top-0 flex"
      style={{ left: -100000, width: 2000, height: 2000 }}
    >
      <PrintDataContext.Provider value={current}>
        <Editor resolver={printTemplateResolver}>
          <DisableWhenMounted onDisabled={onDisabled} />
          <TooltipProvider>
            <PaperContext.Provider value={paper}>
              <DataSourcesContext.Provider value={dataSources}>
                <NodeActionsProvider>
                  <PaperCanvas
                    widthMm={paper.widthMm}
                    heightMm={paper.heightMm}
                    multiPage={paper.multiPage}
                    scale={1}
                    interactive={false}
                    onZoomChange={() => undefined}
                    onFitZoomChange={() => undefined}
                  >
                    <Frame data={content}>{design}</Frame>
                  </PaperCanvas>
                </NodeActionsProvider>
              </DataSourcesContext.Provider>
            </PaperContext.Provider>
          </TooltipProvider>
        </Editor>
      </PrintDataContext.Provider>
    </div>,
    document.body,
  );
}
