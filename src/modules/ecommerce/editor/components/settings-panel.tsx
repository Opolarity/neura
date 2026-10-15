import { useEditor } from "@craftjs/core"
import { VisibilitySettings } from "@/modules/ecommerce/editor/components/visibility-settings"

export function SettingsPanel() {
  const { selected, multiple, actions } = useEditor((state, query) => {
    const currentNodeId = state.events.selected
    let selected
    // Desde el panel de capas se pueden marcar varias con ctrl o shift. Mostrar
    // las propiedades de una cualquiera enganaria, asi que ese caso tiene su
    // propia vista.
    let multiple:
      | { ids: string[]; removedCount: number; deletable: string[] }
      | undefined

    if (currentNodeId) {
      const selectedSet = Array.from(currentNodeId)
      if (selectedSet.length > 1) {
        // La raiz no se borra, asi que no entra en la cuenta.
        const removable = selectedSet.filter((id) => query.node(id).isDeletable())
        multiple = {
          ids: selectedSet,
          removedCount: removable.length,
          // A craft solo se le mandan los de arriba: lo que cuelga de otro
          // seleccionado se va con el, y pasarlo dos veces romperia el borrado.
          deletable: removable.filter((id) => {
            const ancestors = query.node(id).ancestors(true)
            return !selectedSet.some((other) => ancestors.includes(other))
          }),
        }
      } else if (selectedSet.length > 0) {
        const node = state.nodes[selectedSet[0]]
        selected = {
          id: selectedSet[0],
          name: node.data.displayName || node.data.name,
          settings:
            node.related && node.related.settings
              ? node.related.settings
              : null,
          // Lo decide craft: isDeletable() es !isTopLevelNode(), asi que deja
          // fuera la raiz (la Pagina o el Modal), que no se borra desde aqui.
          // Antes se preguntaba por canDrag, que va de arrastrar y no de
          // borrar: por eso la raiz ofrecia un boton de eliminar que no toca.
          isDeletable: query.node(selectedSet[0]).isDeletable(),
        }
      }
    }

    return { selected, multiple }
  })

  if (multiple) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="p-4 border-b border-border shrink-0">
          <h3 className="font-semibold text-sm text-foreground">
            {multiple.ids.length} componentes seleccionados
          </h3>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <p className="px-4 pt-4 text-sm text-muted-foreground">
            Selecciona un solo componente para editar sus propiedades.
          </p>

          {multiple.removedCount > 0 && (
            <div className="inline-flex w-full px-4 py-6">
              <button
                className="w-full text-sm text-destructive hover:text-destructive/80 border border-destructive/30 rounded-md py-2 transition-colors"
                // Un solo delete con la lista entera: craft guarda un juego de
                // parches por accion, asi que se deshace de una vez.
                onClick={() => actions.delete(multiple.deletable)}
              >
                Eliminar {multiple.removedCount}{" "}
                {multiple.removedCount === 1 ? "componente" : "componentes"}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!selected) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Toca un componente de tu página para cambiar su texto, color o tamaño.
      </div>
    )
  }

  return (
    // El nombre se queda fijo arriba; lo que rueda son sus propiedades.
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="p-4 border-b border-border shrink-0">
        <h3 className="font-semibold text-sm text-foreground">
          {selected.name}
        </h3>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {selected.settings && (
          <div className="flex flex-col">
            <selected.settings />
          </div>
        )}

        {/* Comun a todos los componentes y siempre la ultima seccion: por eso
            la monta el panel y no el settings de cada uno. */}
        <VisibilitySettings />

        {selected.isDeletable && (
          <div className="inline-flex w-full px-4 py-6">
            <button
              className="w-full text-sm text-destructive hover:text-destructive/80 border border-destructive/30 rounded-md py-2 transition-colors"
              onClick={() => actions.delete(selected.id)}
            >
              Eliminar componente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
