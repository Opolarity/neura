import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ROOT_NODE,
  useEditor,
  type Node,
  type NodeId,
  type SerializedNodes,
} from "@craftjs/core";
import { getRandomId } from "@craftjs/utils";
import {
  NodeActionsContext,
  type NodeActionsValue,
  type NodeAvailability,
} from "./node-actions-context";

/** Un nodo copiado y sus descendientes, serializados con sus ids originales. */
interface CopiedTree {
  rootId: NodeId;
  nodes: SerializedNodes;
}

/** Si la tecla cae en un campo o en un texto que se está escribiendo. */
const isTypingTarget = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tag = element.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    element.isContentEditable
  );
};

/** Dentro de un diálogo o popover (el del color, el de salir sin guardar). */
const isInsideDialog = (target: EventTarget | null) =>
  target instanceof Element &&
  Boolean(target.closest('[role="dialog"], [role="alertdialog"]'));

/** Hay texto seleccionado en la página: Ctrl+C lo copia el navegador. */
const hasTextSelection = () => {
  const selection = window.getSelection();
  return Boolean(selection && !selection.isCollapsed && selection.toString());
};

/**
 * Copiar, pegar, duplicar y eliminar un nodo, con sus atajos de
 * teclado. Los atajos actúan sobre lo seleccionado, esté en el lienzo o en la
 * Estructura; el menú contextual de cada capa usa las mismas acciones.
 *
 * Lo copiado vive lo que dura la edición de esta plantilla: se guarda
 * serializado, así se puede pegar aunque el original cambie o se borre.
 */
export function NodeActionsProvider({ children }: { children: ReactNode }) {
  const { actions, query, enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));
  const clipboard = useRef<CopiedTree | null>(null);
  const [hasClipboard, setHasClipboard] = useState(false);

  /**
   * Un componente, no la Hoja ni lo que va dentro de una Tabla de datos
   * (`locked`): esos no se copian, duplican ni borran.
   */
  const isComponent = useCallback(
    (id: NodeId) => {
      const node = query.node(id).get();
      return (
        Boolean(node) &&
        query.node(id).isDeletable() &&
        !node.data.props.isPage &&
        !node.data.props.locked &&
        // El encabezado y el pie se quitan desde la Hoja; el pie de grupo,
        // desde su Tabla.
        !node.data.props.pageZone &&
        !node.data.props.groupFooterPart
      );
    },
    [query],
  );

  /** Se pega dentro de él o a su lado: en una Tabla de datos, nada. */
  const canPasteAt = useCallback(
    (id: NodeId) =>
      Boolean(query.node(id).get()) && !query.node(id).get().data.props.locked,
    [query],
  );

  const siblingsOf = useCallback(
    (id: NodeId) => {
      const parentId = query.node(id).get().data.parent;
      return parentId
        ? { parentId, siblings: query.node(parentId).get().data.nodes }
        : null;
    },
    [query],
  );

  const serialize = useCallback(
    (id: NodeId): CopiedTree => {
      const nodes: SerializedNodes = {};
      for (const nodeId of [id, ...query.node(id).descendants(true)]) {
        nodes[nodeId] = query.node(nodeId).toSerializedNode();
      }
      return { rootId: id, nodes };
    },
    [query],
  );

  /** Inserta una copia del árbol (con ids nuevos) y la deja seleccionada. */
  const insert = useCallback(
    (tree: CopiedTree, parentId: NodeId, index: number) => {
      const nodes: Record<NodeId, Node> = {};
      const rebuild = (oldId: NodeId, newParentId: NodeId): NodeId => {
        const serialized = tree.nodes[oldId];
        const newId = getRandomId();
        const childIds = serialized.nodes.map((childId) =>
          rebuild(childId, newId),
        );
        const linkedNodes = Object.fromEntries(
          Object.entries(serialized.linkedNodes ?? {}).map(
            ([name, linkedId]) => [name, rebuild(linkedId, newId)],
          ),
        );
        nodes[newId] = query
          .parseSerializedNode({
            ...serialized,
            parent: newParentId,
            nodes: childIds,
            linkedNodes,
          })
          .toNode((node) => {
            node.id = newId;
          });
        return newId;
      };
      const rootNodeId = rebuild(tree.rootId, parentId);
      actions.addNodeTree({ rootNodeId, nodes }, parentId, index);
      actions.selectNode(rootNodeId);
    },
    [actions, query],
  );

  const availability = useCallback(
    (id: NodeId): NodeAvailability => {
      const component = isComponent(id);
      return {
        copy: component,
        paste: hasClipboard && canPasteAt(id),
        duplicate: component,
        remove: component,
      };
    },
    [hasClipboard, isComponent, canPasteAt],
  );

  const copy = useCallback(
    (id: NodeId) => {
      if (!isComponent(id)) return;
      clipboard.current = serialize(id);
      setHasClipboard(true);
    },
    [isComponent, serialize],
  );

  const paste = useCallback(
    (id: NodeId) => {
      const tree = clipboard.current;
      if (!tree || !canPasteAt(id)) return;
      if (query.node(id).isCanvas()) {
        insert(tree, id, query.node(id).get().data.nodes.length);
        return;
      }
      const place = siblingsOf(id);
      if (place) insert(tree, place.parentId, place.siblings.indexOf(id) + 1);
    },
    [insert, query, siblingsOf, canPasteAt],
  );

  const duplicate = useCallback(
    (id: NodeId) => {
      const place = isComponent(id) ? siblingsOf(id) : null;
      if (place)
        insert(serialize(id), place.parentId, place.siblings.indexOf(id) + 1);
    },
    [insert, isComponent, serialize, siblingsOf],
  );

  const remove = useCallback(
    (id: NodeId) => {
      if (isComponent(id)) actions.delete(id);
    },
    [actions, isComponent],
  );

  // Atajos de teclado. Sin nada seleccionado, pegar va a la Hoja.
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isTypingTarget(event.target)) return;
      if (isInsideDialog(event.target)) return;
      const selectedId = query.getEvent("selected").first();
      const id = selectedId && query.node(selectedId).get() ? selectedId : null;
      const mod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      const run = (action: () => void) => {
        event.preventDefault();
        action();
      };

      if (mod && !event.altKey) {
        if (key === "z" && event.shiftKey) {
          if (query.history.canRedo()) run(() => actions.history.redo());
        } else if (key === "y" && !event.shiftKey) {
          if (query.history.canRedo()) run(() => actions.history.redo());
        } else if (key === "z") {
          if (query.history.canUndo()) run(() => actions.history.undo());
        } else if (event.shiftKey) {
          return;
        } else if (key === "c") {
          if (id && !hasTextSelection()) run(() => copy(id));
        } else if (key === "v") {
          if (clipboard.current) run(() => paste(id ?? ROOT_NODE));
        } else if (key === "d") {
          if (id) run(() => duplicate(id));
        }
        return;
      }

      if (!id || mod || event.shiftKey || event.altKey) return;
      if (event.key === "Delete" || event.key === "Backspace")
        run(() => remove(id));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, actions, query, copy, paste, duplicate, remove]);

  const value = useMemo<NodeActionsValue>(
    () => ({ availability, copy, paste, duplicate, remove }),
    [availability, copy, paste, duplicate, remove],
  );

  return (
    <NodeActionsContext.Provider value={value}>
      {children}
    </NodeActionsContext.Provider>
  );
}
