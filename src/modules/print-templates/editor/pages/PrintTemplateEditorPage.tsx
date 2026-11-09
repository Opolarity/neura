import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Editor, Element, Frame, ROOT_NODE, useEditor } from "@craftjs/core";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "@/shared/hooks/use-toast";
import SplashPage from "@/shared/components/splash/SplashPage";
import { cn } from "@/shared/utils/utils";
import { PRINT_TEMPLATES_PATH } from "../../constants/printTemplateRoutes";
import { findSystemPrintTemplate } from "../../constants/systemPrintTemplates";
import {
  printTemplateGetApi,
  printTemplateUpdateApi,
} from "../../services/printTemplates.service";
import type {
  Imposition,
  PrintTemplateDetail,
  SystemPrintTemplate,
} from "../../types/printTemplates.types";
import { printTemplateResolver } from "../lib/resolver";
import { PaperContext, paperOf } from "../lib/paper-context";
import { DataSourcesContext, sourcesOf } from "../lib/data-table";
import { NodeActionsProvider } from "../lib/node-actions";
import { PdfContainer } from "../components/pdf-container";
import { pageProps } from "../lib/page-props";
import { SYSTEM_DESIGNS } from "../designs";
import { EditorSidebar } from "../components/editor-sidebar";
import { EditorSettingsPanel } from "../components/editor-settings-panel";
import { PaperCanvas } from "../components/paper-canvas";
import { EditorTopbar } from "../components/editor-topbar";
import { UnsavedChangesDialog } from "../components/unsaved-changes-dialog";
import { DisableWhenMounted } from "../print/pdf-render-job";
import "../print-template-editor.css";

/** La medida elegida al crear una plantilla con medidas elegibles. */
export interface PaperChoice {
  widthMm: number;
  heightMm: number;
}

/** Lo elegido en la Nueva plantilla, para arrancar la Hoja. */
interface CreateChoice {
  paper?: PaperChoice | null;
  imposition?: Imposition;
}

/** Lo que tarda en salir un tooltip del editor (ms). */
const EDITOR_TOOLTIP_DELAY_MS = 150;

type LoadState = "loading" | "ready" | "error";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : undefined;

/**
 * Editor de una plantilla personalizada, a pantalla completa.
 *
 * La hoja (medidas) es la de su plantilla del sistema y no se cambia. Sin
 * borradores: Guardar escribe el diseño en content_json y es lo que se imprime.
 */
export default function PrintTemplateEditorPage() {
  const { id } = useParams();
  const templateId = Number(id);
  const [template, setTemplate] = useState<PrintTemplateDetail | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);

  // Lo último guardado, para saber si hay cambios. Lo fija el workspace al
  // terminar de cargar la hoja.
  const savedRef = useRef<string | null>(null);
  // Si quien edita ya hizo algo (entró algo al historial).
  const editedRef = useRef(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!Number.isInteger(templateId) || templateId <= 0) {
      setLoadError("La plantilla no existe.");
      setLoadState("error");
      return;
    }
    let cancelled = false;
    printTemplateGetApi(templateId)
      .then((detail) => {
        if (cancelled) return;
        setTemplate(detail);
        setLoadState("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(errorMessage(error) ?? "No se pudo cargar la plantilla.");
        setLoadState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [templateId]);

  if (loadState === "loading")
    return <SplashPage message="Cargando plantilla..." />;
  if (loadState === "error" || !template)
    return <LoadErrorView message={loadError} />;

  const system = findSystemPrintTemplate(template.systemCode);
  if (!system) {
    return (
      <LoadErrorView
        message={`La plantilla del sistema «${template.systemCode}» ya no existe en el ERP.`}
      />
    );
  }

  return (
    <Editor
      resolver={printTemplateResolver}
      onNodesChange={(query) => {
        if (savedRef.current === null) return;
        // Hasta la primera acción de quien edita (la primera que entra en el
        // historial), lo que cambia lo hizo el editor solo al dibujar la hoja:
        // las filas de una Tabla de datos, por ejemplo. Eso pasa a ser la
        // referencia, no un cambio sin guardar. Después ya no: deshacer hasta
        // el principio sí puede dejar cambios sin guardar.
        if (query.history.canUndo()) editedRef.current = true;
        if (!editedRef.current) {
          savedRef.current = query.serialize();
          setDirty(false);
          return;
        }
        setDirty(query.serialize() !== savedRef.current);
      }}
    >
      <EditorWorkspace
        template={template}
        system={system}
        savedRef={savedRef}
        dirty={dirty}
        setDirty={setDirty}
      />
    </Editor>
  );
}

function LoadErrorView({ message }: { message: string | null }) {
  const navigate = useNavigate();
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <p className="text-sm text-muted-foreground">
        {message ?? "No se pudo cargar la plantilla."}
      </p>
      <Button variant="outline" onClick={() => navigate(PRINT_TEMPLATES_PATH)}>
        Volver a las plantillas
      </Button>
    </div>
  );
}

/**
 * La pantalla del editor. Con `viewOnly` (la ruta /view de una plantilla del
 * sistema) es la misma, siempre en «Vista previa»: sin paneles, sin guardar
 * ni historial, con su diseño de hoy; así /view no se queda atrás de lo que
 * muestra el editor.
 */
export function EditorWorkspace({
  template,
  system,
  savedRef,
  dirty,
  setDirty,
  viewOnly = false,
}: {
  /** La plantilla que se edita; en /view, ninguna. */
  template: PrintTemplateDetail | null;
  system: SystemPrintTemplate;
  savedRef: React.MutableRefObject<string | null>;
  dirty: boolean;
  setDirty: (dirty: boolean) => void;
  viewOnly?: boolean;
}) {
  const navigate = useNavigate();
  const { query, actions } = useEditor();
  const [saving, setSaving] = useState(false);
  // null = ajustada a la pantalla: sigue al tamaño de la ventana.
  const [zoom, setZoom] = useState<number | null>(null);
  const [fitZoom, setFitZoom] = useState(1);
  const scale = zoom ?? fitZoom;
  // Vista previa: el mismo lienzo sin paneles ni marcas de edición. En /view,
  // siempre.
  const [preview, setPreview] = useState(viewOnly);

  // <Frame> carga el diseño al montar: después de eso queda la referencia
  // contra la que se miden los cambios.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      savedRef.current = query.serialize();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [query, savedRef]);

  // Con el editor desactivado no hay selección, contornos ni arrastre: la hoja
  // se ve como se imprimirá. En /view lo apaga DisableWhenMounted, una vez
  // armada la hoja (apagado antes, craft no registra sus elementos).
  useEffect(() => {
    if (viewOnly) return;
    actions.setOptions((options) => {
      options.enabled = !preview;
    });
  }, [actions, preview, viewOnly]);

  const handleSave = useCallback(async () => {
    if (!template) return;
    const serialized = query.serialize();
    try {
      setSaving(true);
      await printTemplateUpdateApi(template.id, {
        contentJson: JSON.parse(serialized),
      });
      savedRef.current = serialized;
      setDirty(false);
      toast({ title: "Plantilla guardada" });
    } catch (error) {
      toast({
        title: "No se pudo guardar la plantilla",
        description: errorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [query, template, savedRef, setDirty]);

  // Ctrl + S (⌘ + S en Mac) guarda, también con el cursor en un campo: antes
  // se suelta el campo, que así deja lo escrito en el diseño. Nunca abre el
  // «Guardar como» del navegador; sin cambios no hace nada.
  const shortcutRef = useRef({ saving, handleSave });
  shortcutRef.current = { saving, handleSave };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (viewOnly) return;
      const mod = event.ctrlKey || event.metaKey;
      if (!mod || event.altKey || event.shiftKey) return;
      if (event.key.toLowerCase() !== "s") return;
      event.preventDefault();
      if (document.activeElement instanceof HTMLElement)
        document.activeElement.blur();
      const { saving, handleSave } = shortcutRef.current;
      if (saving || query.serialize() === savedRef.current) return;
      void handleSave();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [query, savedRef, viewOnly]);

  // Con medidas elegibles, la de la Hoja (la que se eligió al crearla); y la
  // imposición (columnas y copias) que guarda la Hoja.
  const { pageWidth, pageHeight, imposition } = useEditor((state) => ({
    pageWidth: state.nodes[ROOT_NODE]?.data.props.paperWidthMm as
      number | undefined,
    pageHeight: state.nodes[ROOT_NODE]?.data.props.paperHeightMm as
      number | undefined,
    imposition: state.nodes[ROOT_NODE]?.data.props.imposition as unknown,
  }));
  const paper = useMemo(
    () =>
      paperOf(system, {
        paperWidthMm: pageWidth,
        paperHeightMm: pageHeight,
        imposition,
      }),
    [system, pageWidth, pageHeight, imposition],
  );
  // Lo que se eligió al crearla (Nueva plantilla), para arrancar.
  const location = useLocation();
  const choice = location.state as CreateChoice | null;
  const chosenPaper = choice?.paper;
  const chosenImposition = choice?.imposition;
  const dataSources = useMemo(
    () => sourcesOf(system.dataSources, system.dataColumns),
    [system.dataSources, system.dataColumns],
  );

  return (
    // Los tooltips del editor salen rápido: es una herramienta de trabajo y se
    // consultan a cada rato (el resto del ERP sigue con el retraso de siempre).
    <TooltipProvider delayDuration={EDITOR_TOOLTIP_DELAY_MS}>
      <PaperContext.Provider value={paper}>
        {/* Las listas que este documento puede mostrar (Tabla de datos). */}
        <DataSourcesContext.Provider value={dataSources}>
          {/* Copiar, pegar, duplicar y eliminar, con sus atajos. */}
          <NodeActionsProvider>
            <div className="h-screen flex flex-col bg-background">
              <EditorTopbar
                viewOnly={viewOnly}
                title={viewOnly ? system.section : (template?.title ?? "")}
                section={
                  viewOnly
                    ? "Plantilla del sistema · solo lectura"
                    : system.section
                }
                dirty={dirty}
                saving={saving}
                preview={preview}
                scale={scale}
                onZoomChange={setZoom}
                onFit={() => setZoom(null)}
                // Si hay cambios sin guardar, UnsavedChangesDialog pide confirmar.
                onBack={() => navigate(PRINT_TEMPLATES_PATH)}
                onSave={handleSave}
                onTogglePreview={() => setPreview((value) => !value)}
              />

              <div className="flex flex-1 min-h-0">
                {/* En vista previa los paneles se esconden, no se desmontan: así la
              Estructura conserva lo desplegado. */}
                <div className={cn("flex min-h-0", preview && "hidden")}>
                  <EditorSidebar />
                </div>
                <PaperCanvas
                  widthMm={paper.widthMm}
                  heightMm={paper.heightMm}
                  multiPage={paper.multiPage}
                  scale={scale}
                  interactive={!preview}
                  onZoomChange={setZoom}
                  onFitZoomChange={setFitZoom}
                >
                  {viewOnly && <DisableWhenMounted />}
                  <Frame
                    data={
                      template?.contentJson
                        ? JSON.stringify(template.contentJson)
                        : undefined
                    }
                  >
                    {/* Plantilla nueva: arranca con el diseño de hoy de su
                        plantilla del sistema (editor/designs) si lo tiene; si
                        no, con la hoja vacía, un Contenedor que la ocupa
                        entera. */}
                    {SYSTEM_DESIGNS[system.code]?.(
                      pageProps(system, chosenPaper, chosenImposition),
                    ) ?? (
                      <Element
                        is={PdfContainer}
                        canvas
                        {...pageProps(system, chosenPaper, chosenImposition)}
                      />
                    )}
                  </Frame>
                </PaperCanvas>
                <div className={cn("flex min-h-0", preview && "hidden")}>
                  <EditorSettingsPanel />
                </div>
              </div>
            </div>
          </NodeActionsProvider>

          {!viewOnly && <UnsavedChangesDialog dirty={dirty} />}
        </DataSourcesContext.Provider>
      </PaperContext.Provider>
    </TooltipProvider>
  );
}
