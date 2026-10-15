// Portapapeles del editor: copiar componentes de una pagina y pegarlos en otra.
//
// Cada pestaña del editor tiene su propio estado de craft en memoria, asi que
// el unico puente entre dos paginas abiertas es localStorage, que comparten
// todas las pestañas del mismo dominio. Se guardan los nodos ya serializados
// (type -> { resolvedName }), que es lo mismo que viaja en el JSON de la
// pagina; al pegar se reconstruyen con query.parseSerializedNode y el resolver
// del editor, comun a todas las paginas, los vuelve a atar a su componente.

import { getRandomId } from "@craftjs/utils"
import type { Node, NodeTree, SerializedNode, SerializedNodes } from "@craftjs/core"

export const CLIPBOARD_STORAGE_KEY = "editor-clipboard"
export const ROOT_NODE_ID = "ROOT"

// Un arbol copiado: la raiz del recorte y todos sus descendientes (hijos y
// linkedNodes), con los ids originales. Se renombran al pegar, no al copiar,
// para poder pegar varias veces el mismo recorte.
export interface ClipboardTree {
  rootNodeId: string
  nodes: SerializedNodes
}

export interface EditorClipboard {
  trees: ClipboardTree[]
  copiedAt: number
}

// La consulta de craft que hace falta aqui, sin arrastrar el tipo completo del
// useEditor (que es generico y cambia con el selector).
type CraftQuery = {
  node: (id: string) => {
    get: () => Node
    isCanvas: () => boolean
    isTopLevelNode: () => boolean
    ancestors: (deep?: boolean) => string[]
    descendants: (deep?: boolean, includeOnly?: "linkedNodes" | "childNodes") => string[]
    toSerializedNode: () => SerializedNode
  }
  parseSerializedNode: (serializedNode: SerializedNode) => {
    toNode: (normalize?: (node: Node) => void) => Node
  }
}

// ── Almacenamiento ──────────────────────────────────────────────────────────

const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((listener) => listener())
}

export function readEditorClipboard(): EditorClipboard | null {
  try {
    const raw = window.localStorage.getItem(CLIPBOARD_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray(parsed.trees) &&
      parsed.trees.length > 0 &&
      typeof parsed.copiedAt === "number"
    ) {
      return parsed as EditorClipboard
    }
    return null
  } catch {
    return null
  }
}

export function writeEditorClipboard(trees: ClipboardTree[]): boolean {
  try {
    const clipboard: EditorClipboard = { trees, copiedAt: Date.now() }
    window.localStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(clipboard))
    notify()
    return true
  } catch {
    // localStorage no disponible o cuota llena
    return false
  }
}

// Para useSyncExternalStore: la propia pestaña avisa por notify() y las demas
// llegan por el evento "storage", que el navegador dispara en todas las
// pestañas del mismo origen salvo en la que escribio.
export function subscribeEditorClipboard(listener: () => void): () => void {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === CLIPBOARD_STORAGE_KEY) listener()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

// Instantanea barata para el store: basta con saber si hay algo y de cuando.
export function getEditorClipboardSnapshot(): number {
  return readEditorClipboard()?.copiedAt ?? 0
}

export function getEditorClipboardServerSnapshot(): number {
  return 0
}

// ── Copiar ──────────────────────────────────────────────────────────────────

// Deja solo las raices de la seleccion: si un contenedor y algo de dentro estan
// seleccionados a la vez, el hijo ya viaja dentro del contenedor.
export function topLevelSelection(query: CraftQuery, selected: string[]): string[] {
  return selected
    .filter((id) => !query.node(id).isTopLevelNode())
    .filter((id) => {
      const ancestors = query.node(id).ancestors(true)
      return !selected.some((other) => other !== id && ancestors.includes(other))
    })
}

export function serializeTree(query: CraftQuery, rootId: string): ClipboardTree {
  const nodes: SerializedNodes = {}
  const ids = [rootId, ...query.node(rootId).descendants(true)]
  for (const id of ids) {
    nodes[id] = query.node(id).toSerializedNode()
  }
  // La raiz del recorte se desata de su padre original: al pegar se le asigna
  // el destino.
  nodes[rootId] = { ...nodes[rootId], parent: null as unknown as string }
  return { rootNodeId: rootId, nodes }
}

// Copia los nodos seleccionados al portapapeles. Devuelve cuantos arboles se
// copiaron (0 si no habia nada copiable o si localStorage fallo).
export function copyNodesToClipboard(query: CraftQuery, selected: string[]): number {
  const roots = topLevelSelection(query, selected)
  if (roots.length === 0) return 0
  const trees = roots.map((id) => serializeTree(query, id))
  return writeEditorClipboard(trees) ? trees.length : 0
}

// ── Pegar ───────────────────────────────────────────────────────────────────

// Reconstruye un arbol del portapapeles como NodeTree de craft, con ids nuevos
// en todos los nodos. Misma logica que el "Duplicar" del panel de capas, pero
// partiendo de nodos serializados, que es lo unico que sobrevive al viaje por
// localStorage.
export function buildNodeTree(
  query: CraftQuery,
  tree: ClipboardTree,
  parentId: string
): NodeTree {
  const nodes: Record<string, Node> = {}

  const rebuild = (oldId: string, newParentId: string): string => {
    const serialized = tree.nodes[oldId]
    if (!serialized) {
      throw new Error(`Nodo ${oldId} ausente en el portapapeles`)
    }
    const newId = getRandomId()

    const childIds = (serialized.nodes ?? []).map((childId) => rebuild(childId, newId))
    const linkedNodes = Object.keys(serialized.linkedNodes ?? {}).reduce(
      (acc: Record<string, string>, linkName) => {
        acc[linkName] = rebuild(serialized.linkedNodes[linkName], newId)
        return acc
      },
      {}
    )

    const node = query
      .parseSerializedNode({
        ...serialized,
        parent: newParentId,
        nodes: childIds,
        linkedNodes,
      })
      .toNode((n) => {
        n.id = newId
      })
    nodes[newId] = node
    return newId
  }

  const rootNodeId = rebuild(tree.rootNodeId, parentId)
  return { rootNodeId, nodes }
}

export interface PasteTarget {
  parentId: string
  index: number
}

// Donde puede caer lo pegado segun lo seleccionado, por orden de preferencia:
// - nada seleccionado: al final de la Pagina;
// - un contenedor (canvas): dentro, al final; si no admite el recorte, justo
//   debajo, en su mismo padre;
// - cualquier otra cosa: justo debajo, en su mismo padre.
// Se devuelven candidatos y no uno solo porque un nodo puede ser canvas y aun
// asi rechazar hijos: las paginas guardadas antes de que las hojas dejaran de
// ser canvas conservan isCanvas en el JSON, pero su canMoveIn ya dice que no.
export function resolvePasteTargets(query: CraftQuery, selected: string[]): PasteTarget[] {
  const atRootEnd = (): PasteTarget => ({
    parentId: ROOT_NODE_ID,
    index: query.node(ROOT_NODE_ID).get().data.nodes.length,
  })

  const anchor = selected[selected.length - 1]
  if (!anchor) return [atRootEnd()]

  const node = query.node(anchor)
  const targets: PasteTarget[] = []
  if (node.isCanvas()) {
    targets.push({ parentId: anchor, index: node.get().data.nodes.length })
  }
  const parentId = node.get().data.parent
  if (parentId) {
    const siblings = query.node(parentId).get().data.nodes
    targets.push({ parentId, index: siblings.indexOf(anchor) + 1 })
  } else if (targets.length === 0) {
    targets.push(atRootEnd())
  }
  return targets
}

// Aplica la regla canMoveIn del contenedor destino, que craft solo consulta al
// arrastrar: addNodeTree no valida nada.
export function canPasteInto(query: CraftQuery, parentId: string, incoming: Node[]): boolean {
  const parent = query.node(parentId)
  if (!parent.isCanvas()) return false
  const parentNode = parent.get()
  const rule = parentNode.rules?.canMoveIn
  if (!rule) return true
  try {
    return rule(incoming, parentNode, query.node as never)
  } catch {
    return false
  }
}

export type PasteOutcome =
  | { status: "ok"; count: number; rootIds: string[]; parentId: string }
  | { status: "empty" }
  | { status: "rejected" }
  | { status: "error" }

// Pega el contenido del portapapeles. Recibe addNodeTree del editor para no
// depender de su tipo; devuelve el resultado para que quien llame avise.
export function pasteFromClipboard(
  query: CraftQuery,
  addNodeTree: (tree: NodeTree, parentId: string, index: number) => void,
  selected: string[]
): PasteOutcome {
  const clipboard = readEditorClipboard()
  if (!clipboard) return { status: "empty" }

  // Se prueba cada destino por orden; el primero que admita el recorte se
  // queda con el. Los arboles se reconstruyen por destino porque el parent de
  // la raiz va dentro del nodo.
  for (const target of resolvePasteTargets(query, selected)) {
    let trees: NodeTree[]
    try {
      trees = clipboard.trees.map((tree) => buildNodeTree(query, tree, target.parentId))
    } catch {
      return { status: "error" }
    }

    const roots = trees.map((tree) => tree.nodes[tree.rootNodeId])
    if (!canPasteInto(query, target.parentId, roots)) continue

    trees.forEach((tree, offset) => {
      addNodeTree(tree, target.parentId, target.index + offset)
    })

    return {
      status: "ok",
      count: trees.length,
      rootIds: trees.map((tree) => tree.rootNodeId),
      parentId: target.parentId,
    }
  }

  return { status: "rejected" }
}
