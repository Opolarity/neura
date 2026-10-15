import { useEditor } from "@craftjs/core"
import { getRandomId } from "@craftjs/utils"
import { useLayer, EditableLayerName } from "@craftjs/layers"
import { ChevronDown, Copy, Eye, EyeOff } from "lucide-react"
import { cn } from "@/shared/utils/utils"
import { LAYER_ID_ATTR, useLayersSelection } from "./layers-selection"

export function CustomLayer({ children }: { children?: React.ReactNode }) {
  const {
    id,
    depth,
    children: childIds,
    expanded,
    connectors: { drag, layer, layerHeader },
    actions: { toggleLayer },
  } = useLayer((layer) => ({
    expanded: layer.expanded,
  }))

  const selection = useLayersSelection()

  const { actions, query, hidden, selected, isRoot, displayName } = useEditor((state, query) => {
    const node = state.nodes[id]
    return {
      hidden: node && node.data.hidden,
      selected: query.getEvent("selected").contains(id),
      isRoot: !node?.data.parent,
      // Solo para el title del nombre truncado: el arbol se estrecha rapido con
      // la indentacion y sin el no hay forma de leer una capa anidada.
      displayName:
        node?.data.custom?.displayName ?? node?.data.displayName ?? node?.data.name,
    }
  })

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation()

    const tree = query.node(id).toNodeTree()
    const newNodes: Record<string, any> = {}

    const changeNodeId = (nodeId: string, newParentId?: string): string => {
      const node = tree.nodes[nodeId]
      const newNodeId = getRandomId()
      const childNodes = node.data.nodes.map((childId: string) =>
        changeNodeId(childId, newNodeId)
      )
      const linkedNodes = Object.keys(node.data.linkedNodes || {}).reduce(
        (acc: Record<string, string>, linkName) => {
          acc[linkName] = changeNodeId(node.data.linkedNodes[linkName], newNodeId)
          return acc
        },
        {}
      )

      const tmpNode = {
        ...node,
        id: newNodeId,
        data: {
          ...node.data,
          parent: newParentId ?? node.data.parent,
          nodes: childNodes,
          linkedNodes,
        },
      }
      const freshNode = query.parseFreshNode(tmpNode).toNode((n) => {
        n.id = newNodeId
      })
      newNodes[newNodeId] = freshNode
      return newNodeId
    }

    const rootNodeId = changeNodeId(tree.rootNodeId)
    const newTree = { rootNodeId, nodes: newNodes }

    const parentId = query.node(id).get().data.parent
    if (!parentId) return
    const parentNodes = query.node(parentId).get().data.nodes
    const index = parentNodes.indexOf(id)

    actions.addNodeTree(newTree, parentId, index + 1)
  }

  return (
    <div
      ref={(dom) => {
        if (dom) layer(dom)
      }}
      className="flex flex-col"
    >
      <div
        ref={(dom) => {
          if (dom) drag(dom)
        }}
        // Lo lee el rango de shift para saber el orden visual del arbol.
        {...{ [LAYER_ID_ATTR]: id }}
        // En captura, para adelantarse al handler de seleccion del core cuando
        // se pulsa shift. El core escucha mousedown y click, y hay que cortarle
        // los dos: si solo se corta el mousedown, en el click colapsa el rango
        // a una sola capa.
        onMouseDownCapture={(e) => selection?.onLayerMouseDown(id, e)}
        onClickCapture={(e) => selection?.onLayerClick(e)}
        // La fila no lleva padding vertical propio: lo pone cada parte, para que
        // el chevron, el nombre y los botones ocupen el alto completo y no quede
        // ninguna franja muerta entre ellos.
        className={cn(
          "flex items-stretch justify-between text-xs border-b border-border/50 cursor-grab select-none transition-colors",
          selected ? "bg-primary/10" : "hover:bg-muted/30"
        )}
        // Solo la sangria del arbol: el aire lateral lo ponen los hijos.
        style={{ paddingLeft: depth * 12 }}
      >
        <div
          ref={(dom) => {
            if (dom) layerHeader(dom)
          }}
          className="flex items-stretch min-w-0 flex-1"
        >
          {childIds.length > 0 ? (
            <span
              className="flex shrink-0 items-center px-2 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              onMouseDown={() => toggleLayer()}
            >
              <ChevronDown
                className={cn("h-3 w-3 transition-transform", !expanded && "-rotate-90")}
              />
            </span>
          ) : (
            // Hueco del mismo ancho que el chevron, para que los nombres de las
            // capas sin hijos queden alineados con los que si lo tienen.
            <span className="flex shrink-0 items-center px-2 py-2.5">
              <span className="h-3 w-3" />
            </span>
          )}
          <span className="flex items-center min-w-0 py-2.5 pr-2.5">
            {/* El truncate va en un hijo: sobre un flex item el text-overflow
                no aplica y no saldrian los puntos suspensivos. */}
            <span className="truncate" title={displayName}>
              <EditableLayerName />
            </span>
          </span>
        </div>

        {/* Los botones se tocan entre si y separan sus iconos con el padding
            propio, no con un gap del contenedor. */}
        <div className="flex items-stretch shrink-0">
          {!isRoot && (
            <div
              onClick={handleDuplicate}
              title="Duplicar"
              className="flex items-center px-2.5 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" />
            </div>
          )}
          <div
            onClick={(e) => {
              e.stopPropagation()
              actions.setHidden(id, !hidden)
            }}
            title={hidden ? "Mostrar" : "Ocultar"}
            className="flex items-center px-2.5 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </div>
        </div>
      </div>

      {expanded ? children : null}
    </div>
  )
}
