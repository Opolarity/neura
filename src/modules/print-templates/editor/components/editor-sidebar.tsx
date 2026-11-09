import { useEffect, useState, type ReactElement } from "react";
import { Element, useEditor } from "@craftjs/core";
import { Layers } from "@craftjs/layers";
import type { LucideIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { COMPONENT_ICONS } from "../lib/component-icons";
import { LayerExpansionProvider } from "../lib/layer-expansion";
import { useLayerExpansion } from "../lib/layer-expansion-context";
import { PdfContainer } from "./pdf-container";
import { PdfText } from "./pdf-text";
import { PdfDataTable } from "./pdf-data-table";
import { PdfImage } from "./pdf-image";
import { PdfQr } from "./pdf-qr";
import { PdfBarcode } from "./pdf-barcode";
import { useDataSources } from "../lib/data-table";
import { PdfLayer } from "./pdf-layer";
import { PAPER_ATTR } from "./paper-canvas";
import { EditorTooltip } from "./editor-tooltip";

interface ToolboxItem {
  label: string;
  /** Su tooltip: «Arrastra un texto a la hoja». */
  hint: string;
  icon: LucideIcon;
  element: ReactElement;
}

const ITEMS: ToolboxItem[] = [
  {
    label: "Contenedor",
    hint: "Arrastra un contenedor a la hoja",
    icon: COMPONENT_ICONS.Contenedor,
    element: <Element is={PdfContainer} canvas />,
  },
  {
    label: "Texto",
    hint: "Arrastra un texto a la hoja",
    icon: COMPONENT_ICONS.Texto,
    element: <PdfText />,
  },
  {
    label: "Imagen",
    hint: "Arrastra una imagen a la hoja",
    icon: COMPONENT_ICONS.Imagen,
    element: <PdfImage />,
  },
  {
    label: "QR",
    hint: "Arrastra un código QR a la hoja",
    icon: COMPONENT_ICONS.QR,
    element: <PdfQr />,
  },
  {
    label: "Código de barras",
    hint: "Arrastra un código de barras a la hoja",
    icon: COMPONENT_ICONS["Código de barras"],
    element: <PdfBarcode />,
  },
];

type SidebarTab = "components" | "structure";

/** Componentes que se arrastran a la hoja. */
function Toolbox() {
  const { connectors } = useEditor();
  // Las que tienen filas: una fuente de valores sueltos (los datos del
  // envío) no se muestra en una tabla.
  const sources = useDataSources().filter((source) => source.fields.length);
  // La Tabla de datos solo en los documentos que tienen listas: arranca con
  // la primera de ellas.
  const items: ToolboxItem[] = sources.length
    ? [
        ...ITEMS,
        {
          label: "Tabla de datos",
          hint: "Arrastra una tabla de datos a la hoja",
          icon: COMPONENT_ICONS["Tabla de datos"],
          // Con todas sus filas de ejemplo: así se ve como el documento.
          element: (
            <PdfDataTable
              source={sources[0].id}
              sampleRows={sources[0].mockRows.length}
            />
          ),
        },
      ]
    : ITEMS;

  return (
    <div className="grid grid-cols-2 gap-2 p-4">
      {items.map(({ label, hint, icon: Icon, element }) => (
        <EditorTooltip key={label} label={hint}>
          <div
            ref={(node) => {
              if (node) connectors.create(node, element);
            }}
            className="flex flex-col items-center gap-1.5 rounded-md border border-border bg-background p-3 text-center text-[12px] cursor-grab select-none hover:bg-muted"
          >
            <Icon className="h-5 w-5" />
            {label}
          </div>
        </EditorTooltip>
      ))}
    </div>
  );
}

/** Panel izquierdo: los componentes y la estructura (árbol) de la hoja. */
export function EditorSidebar() {
  // El despliegue de la Estructura vive aquí, que no se desmonta al cambiar
  // de pestaña.
  return (
    <LayerExpansionProvider>
      <SidebarTabs />
    </LayerExpansionProvider>
  );
}

function SidebarTabs() {
  const [tab, setTab] = useState<SidebarTab>("components");
  const { expandPath } = useLayerExpansion();
  const { selectedId, query } = useEditor((_, editorQuery) => ({
    selectedId: editorQuery.getEvent("selected").first() ?? null,
  }));

  // Al seleccionar algo en el lienzo: se pasa a Estructura y se despliegan sus
  // ancestros, para que su fila exista y PdfLayer pueda llevarla a la vista.
  useEffect(() => {
    if (!selectedId) return;
    setTab("structure");
    if (query.node(selectedId).get())
      expandPath(query.node(selectedId).ancestors(true));
  }, [selectedId, query, expandPath]);

  // Pulsar en la hoja lo que ya estaba seleccionado no cambia la selección:
  // también se pasa a Estructura.
  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest?.(`[${PAPER_ATTR}]`)) setTab("structure");
    };
    document.addEventListener("mousedown", onMouseDown, true);
    return () => document.removeEventListener("mousedown", onMouseDown, true);
  }, []);

  return (
    <aside className="w-[240px] shrink-0 border-r border-border bg-background flex flex-col min-h-0">
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as SidebarTab)}
        className="flex flex-col flex-1 min-h-0"
      >
        <div className="px-3 pt-3 pb-2 border-b border-border">
          {/* El trigger trae px-3/py-1.5: con dos pestañas a media columna no
              cabe "Componentes", y su alto pasa del de la lista. */}
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger
              value="components"
              className="min-w-0 px-1.5 py-1 text-[12px] leading-5"
            >
              Componentes
            </TabsTrigger>
            <TabsTrigger
              value="structure"
              className="min-w-0 px-1.5 py-1 text-[12px] leading-5"
            >
              Estructura
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent
          value="components"
          className="mt-0 flex-1 min-h-0 overflow-y-auto"
        >
          <Toolbox />
        </TabsContent>
        <TabsContent
          value="structure"
          className="mt-0 flex-1 min-h-0 overflow-y-auto px-2 py-2"
        >
          <Layers expandRootOnLoad renderLayer={PdfLayer} />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
