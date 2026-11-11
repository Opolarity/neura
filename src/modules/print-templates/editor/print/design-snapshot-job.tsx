import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Editor, Frame, useEditor } from "@craftjs/core";
import { TooltipProvider } from "@/components/ui/tooltip";
import type {
  Imposition,
  SystemPrintTemplate,
} from "../../types/printTemplates.types";
import { printTemplateResolver } from "../lib/resolver";
import { PaperContext, paperOf } from "../lib/paper-context";
import { DataSourcesContext, sourcesOf } from "../lib/data-table";
import { NodeActionsProvider } from "../lib/node-actions";
import { pageProps } from "../lib/page-props";
import { initialDesign } from "../lib/initial-design";
import { PaperCanvas } from "../components/paper-canvas";
import { nextFrame, sheetReady } from "./sheet-ready";

/** Lo más que se espera a que la hoja termine de armarse (ms). */
const SNAPSHOT_TIMEOUT_MS = 5000;

/**
 * Serializa el diseño cuando la hoja ya está armada (también las filas de
 * ejemplo de cada Tabla de datos, que se agregan después de dibujarse): lo
 * mismo que guardaría el editor sin que nadie toque nada. Si algo nunca llega
 * a armarse, se serializa igual al cumplirse el tope.
 */
function SnapshotWhenReady({
  onDone,
  onError,
}: {
  onDone: (content: Record<string, unknown>) => void;
  onError: (error: unknown) => void;
}) {
  const { query, ready } = useEditor((state) => ({
    ready: sheetReady(state.nodes, null),
  }));
  const done = useRef(false);
  const alive = useRef(false);
  const finish = useRef<() => void>(() => undefined);
  finish.current = () => {
    if (done.current || !alive.current) return;
    done.current = true;
    try {
      onDone(JSON.parse(query.serialize()) as Record<string, unknown>);
    } catch (error) {
      onError(error);
    }
  };
  useEffect(() => {
    alive.current = true;
    const timer = window.setTimeout(
      () => finish.current(),
      SNAPSHOT_TIMEOUT_MS,
    );
    return () => {
      alive.current = false;
      window.clearTimeout(timer);
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    // Un cuadro más: lo que se acomoda al terminar de armarse.
    void nextFrame().then(() => finish.current());
  }, [ready]);
  return null;
}

/**
 * Arma fuera de la vista la Hoja con que arranca una plantilla nueva (su
 * plantilla del sistema, con la medida y la impresión elegidas) y entrega su
 * diseño serializado, el content_json con que se crea. Se monta, entrega el
 * diseño por `onDone` y quien la montó la quita.
 */
export function DesignSnapshotJob({
  system,
  paper: chosenPaper,
  imposition,
  onDone,
  onError,
}: {
  system: SystemPrintTemplate;
  paper: { widthMm: number; heightMm: number } | null;
  imposition: Imposition;
  onDone: (content: Record<string, unknown>) => void;
  onError: (error: unknown) => void;
}) {
  // La hoja se arma una sola vez, con lo que llegó al montarse.
  const page = useRef(pageProps(system, chosenPaper, imposition)).current;
  const paper = useMemo(() => paperOf(system, page), [system, page]);
  const dataSources = useMemo(
    () => sourcesOf(system.dataSources, system.dataColumns),
    [system.dataSources, system.dataColumns],
  );

  return createPortal(
    // Fuera de la vista, pero con su tamaño: el navegador la acomoda igual.
    <div
      aria-hidden
      className="pointer-events-none fixed top-0 flex"
      style={{ left: -100000, width: 2000, height: 2000 }}
    >
      <Editor resolver={printTemplateResolver}>
        <SnapshotWhenReady onDone={onDone} onError={onError} />
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
                  <Frame>{initialDesign(system, page)}</Frame>
                </PaperCanvas>
              </NodeActionsProvider>
            </DataSourcesContext.Provider>
          </PaperContext.Provider>
        </TooltipProvider>
      </Editor>
    </div>,
    document.body,
  );
}
