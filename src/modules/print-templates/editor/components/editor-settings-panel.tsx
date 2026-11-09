import { createElement } from "react";
import { ROOT_NODE, useEditor } from "@craftjs/core";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorTooltip } from "./editor-tooltip";

/**
 * Propiedades del componente seleccionado en la hoja. Sin selección (al
 * entrar, o tras borrar el seleccionado) muestra las de la Hoja.
 */
export function EditorSettingsPanel() {
  const { current, actions } = useEditor((state, query) => {
    const selectedId = query.getEvent("selected").first();
    const id = selectedId && state.nodes[selectedId] ? selectedId : ROOT_NODE;
    const node = state.nodes[id];
    if (!node) return { current: null };
    return {
      current: {
        id,
        name: node.data.props.isPage ? "Hoja" : node.data.displayName,
        settings: node.related?.settings,
        // La raíz (la hoja) no se borra, ni lo de dentro de una Tabla de
        // datos (`locked`).
        deletable: query.node(id).isDeletable() && !node.data.props.locked,
      },
    };
  });

  return (
    <aside className="w-[300px] shrink-0 border-l border-border bg-background flex flex-col min-h-0">
      <div className="flex items-center justify-between gap-2 px-4 h-12 shrink-0 border-b border-border">
        <p className="text-sm font-medium truncate">
          {current?.name ?? "Hoja"}
        </p>
        {current?.deletable && (
          <EditorTooltip label={`Eliminar ${current.name.toLowerCase()}`}>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => actions.delete(current.id)}
              aria-label={`Eliminar ${current.name.toLowerCase()}`}
            >
              <Trash className="w-3.5 h-3.5" />
            </Button>
          </EditorTooltip>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {current?.settings && (
          // Un panel por nodo: el estado interno (lados enlazados) no pasa al siguiente.
          <div key={current.id}>{createElement(current.settings)}</div>
        )}
      </div>
    </aside>
  );
}
