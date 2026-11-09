import { createContext, useContext } from "react";
import type { NodeId } from "@craftjs/core";

/** Qué capas de la Estructura están desplegadas (ver layer-expansion.tsx). */
export interface LayerExpansionValue {
  isExpanded: (id: NodeId) => boolean;
  setExpanded: (id: NodeId, expanded: boolean) => void;
  /** Despliega varias a la vez (los ancestros de un nodo seleccionado). */
  expandPath: (ids: NodeId[]) => void;
}

export const LayerExpansionContext = createContext<LayerExpansionValue | null>(null);

export function useLayerExpansion(): LayerExpansionValue {
  const context = useContext(LayerExpansionContext);
  if (!context) throw new Error("useLayerExpansion necesita un LayerExpansionProvider");
  return context;
}
