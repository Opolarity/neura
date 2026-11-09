import { createContext, useContext } from "react";
import type { NodeId } from "@craftjs/core";

/** Lo que se puede hacer con un nodo ahora mismo (ver node-actions.tsx). */
export interface NodeAvailability {
  copy: boolean;
  paste: boolean;
  duplicate: boolean;
  remove: boolean;
}

/**
 * Las acciones de la Estructura sobre un nodo: las usan los atajos de teclado
 * y el menú contextual de cada capa.
 */
export interface NodeActionsValue {
  availability: (id: NodeId) => NodeAvailability;
  copy: (id: NodeId) => void;
  /** Dentro si `id` es un Contenedor; si no, justo después. */
  paste: (id: NodeId) => void;
  duplicate: (id: NodeId) => void;
  remove: (id: NodeId) => void;
}

export const NodeActionsContext = createContext<NodeActionsValue | null>(null);

export function useNodeActions(): NodeActionsValue {
  const context = useContext(NodeActionsContext);
  if (!context)
    throw new Error("useNodeActions necesita un NodeActionsProvider");
  return context;
}
