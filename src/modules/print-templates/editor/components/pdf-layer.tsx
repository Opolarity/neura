import { useEffect, useRef, useState, type ReactNode } from "react";
import { ROOT_NODE, useEditor } from "@craftjs/core";
import { useLayer } from "@craftjs/layers";
import { ChevronDown } from "lucide-react";
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import { cn } from "@/shared/utils/utils";
import { PAGE_ZONE_LABEL } from "../lib/page-zones";
import { COMPONENT_ICONS, PAGE_ICON } from "../lib/component-icons";
import { useLayerExpansion } from "../lib/layer-expansion-context";
import { EditorTooltip } from "./editor-tooltip";
import { NodeMenuContent } from "./node-context-menu";

/**
 * Plegar/desplegar sin seleccionar la capa. El conector de la fila selecciona
 * con listeners nativos de mousedown, así que un stopPropagation de React
 * llegaría tarde: se corta con uno nativo en el propio chevron, que corre
 * antes que los de la fila.
 */
function LayerToggle({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const onToggleRef = useRef(onToggle);
  onToggleRef.current = onToggle;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const onMouseDown = (event: MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
      onToggleRef.current();
    };
    const stop = (event: MouseEvent) => event.stopPropagation();
    element.addEventListener("mousedown", onMouseDown);
    element.addEventListener("click", stop);
    return () => {
      element.removeEventListener("mousedown", onMouseDown);
      element.removeEventListener("click", stop);
    };
  }, []);

  return (
    <EditorTooltip label={expanded ? "Plegar" : "Desplegar"}>
      <span
        ref={ref}
        className="flex shrink-0 items-center px-2 py-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
      >
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform",
            !expanded && "-rotate-90",
          )}
        />
      </span>
    </EditorTooltip>
  );
}

/**
 * Una fila de la pestaña Estructura: chevron para plegar, nombre y arrastre
 * para reordenar. El conector `layer` de @craftjs/layers selecciona el nodo al
 * pulsar la fila. Versión ligera de ecommerce/editor/components/custom-layer.
 * Con el clic derecho se selecciona y abre su menú (NodeMenuContent), salvo
 * la Hoja, que no tiene.
 *
 * Lo desplegado lo decide layer-expansion (sobrevive al cambio de pestaña).
 */
export function PdfLayer({ children }: { children?: ReactNode }) {
  const {
    id,
    depth,
    children: childIds,
    expanded,
    connectors: { drag, layer, layerHeader },
    actions: { setExpandedState },
  } = useLayer((state) => ({ expanded: state.expanded }));

  const {
    actions: editorActions,
    selected,
    name,
    zone,
    groupFooter,
    isRoot,
    hidden,
  } = useEditor((state, query) => {
    const node = state.nodes[id];
    const isRoot = id === ROOT_NODE || Boolean(node?.data.props?.isPage);
    return {
      selected: query.getEvent("selected").contains(id),
      hidden: Boolean(node?.data.hidden),
      name: isRoot ? "Hoja" : (node?.data.displayName ?? ""),
      zone: node?.data.props?.pageZone as "header" | "footer" | "" | undefined,
      groupFooter: Boolean(node?.data.props?.groupFooterPart),
      isRoot,
    };
  });
  const Icon = isRoot ? PAGE_ICON : COMPONENT_ICONS[name];
  // El encabezado y el pie de página se llaman como lo que son.
  const label = zone
    ? PAGE_ZONE_LABEL[zone]
    : groupFooter
      ? "Pie de grupo"
      : name;

  // Cada clic derecho monta el menú de nuevo: si ya estaba abierto (o
  // cerrándose), Radix lo reabre en el mismo sitio en vez de ir al clic.
  const [menuKey, setMenuKey] = useState(0);

  const expansion = useLayerExpansion();
  const shouldExpand = expansion.isExpanded(id);

  // La librería sigue a lo recordado, también al volver a montarse.
  useEffect(() => {
    if (expanded !== shouldExpand) setExpandedState(shouldExpand);
  }, [expanded, shouldExpand, setExpandedState]);

  // Seleccionada (desde el lienzo o aquí): que se vea, con un scroll suave y
  // solo lo justo. Tras un frame, para que la pestaña ya esté pintada.
  const rowRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!selected) return;
    const frame = requestAnimationFrame(() =>
      rowRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [selected]);

  // Un nodo oculto (craft no lo dibuja en la hoja, como el encabezado de una
  // Tabla de datos sin «Mostrar encabezado») tampoco sale aquí: no habría qué
  // seleccionar en el lienzo.
  if (hidden) return null;

  return (
    <div
      ref={(dom) => {
        if (dom) layer(dom);
      }}
      className="flex flex-col"
    >
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            onContextMenu={(event) => {
              editorActions.selectNode(id);
              // La Hoja no tiene menú: no se copia, duplica ni borra. Sin el
              // del navegador tampoco (Radix no abre si ya está prevenido).
              if (isRoot) event.preventDefault();
              else setMenuKey((key) => key + 1);
            }}
            ref={(dom) => {
              rowRef.current = dom;
              if (dom) drag(dom);
            }}
            className={cn(
              "mb-0.5 flex items-stretch rounded-md text-[12px] cursor-grab select-none transition-colors",
              selected ? "bg-primary/10 font-medium" : "hover:bg-muted",
            )}
            // La sangría es margen, para que el resaltado empiece donde empieza la capa.
            style={{ marginLeft: depth * 12 }}
          >
            <div
              ref={(dom) => {
                if (dom) layerHeader(dom);
              }}
              className="flex items-stretch min-w-0 flex-1"
            >
              {childIds.length > 0 ? (
                <LayerToggle
                  expanded={shouldExpand}
                  onToggle={() => expansion.setExpanded(id, !shouldExpand)}
                />
              ) : (
                // Mismo ancho que el chevron, para alinear los nombres.
                <span className="flex shrink-0 items-center px-2 py-1.5">
                  <span className="h-3 w-3" />
                </span>
              )}
              {/* El icono del componente, a la izquierda del nombre. */}
              {Icon && (
                <span className="flex shrink-0 items-center pr-1.5 text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                </span>
              )}
              <span className="flex items-center min-w-0 py-1.5 pr-2.5">
                <EditorTooltip label={label} side="right">
                  <span className="truncate">{label}</span>
                </EditorTooltip>
              </span>
            </div>
          </div>
        </ContextMenuTrigger>
        <NodeMenuContent key={menuKey} id={id} />
      </ContextMenu>

      {expanded ? children : null}
    </div>
  );
}
