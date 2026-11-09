import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ROOT_NODE, type NodeId } from "@craftjs/core";
import { LayerExpansionContext } from "./layer-expansion-context";

/**
 * Guarda qué capas de la pestaña Estructura están desplegadas.
 *
 * @craftjs/layers guarda el despliegue en su propio store, que se pierde al
 * desmontar <Layers> (al pasar a Componentes). Este estado vive en el panel,
 * que no se desmonta, y cada capa se sincroniza con él al volver: dura lo que
 * dura la edición, sin guardarse en ningún sitio.
 */
export function LayerExpansionProvider({ children }: { children: ReactNode }) {
  // La Hoja arranca desplegada; se puede plegar como cualquier otra.
  const [expanded, setExpandedIds] = useState<ReadonlySet<NodeId>>(() => new Set([ROOT_NODE]));

  const isExpanded = useCallback((id: NodeId) => expanded.has(id), [expanded]);

  const setExpanded = useCallback((id: NodeId, value: boolean) => {
    setExpandedIds((prev) => {
      if (prev.has(id) === value) return prev;
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const expandPath = useCallback((ids: NodeId[]) => {
    setExpandedIds((prev) => {
      if (ids.every((id) => prev.has(id))) return prev;
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ isExpanded, setExpanded, expandPath }),
    [isExpanded, setExpanded, expandPath]
  );

  return <LayerExpansionContext.Provider value={value}>{children}</LayerExpansionContext.Provider>;
}
