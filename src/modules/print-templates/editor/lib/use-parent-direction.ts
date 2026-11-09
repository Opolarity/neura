import { useEditor, useNode } from "@craftjs/core";
import type { FlexDirection } from "./style-props";

/**
 * Cómo reparte el contenedor padre del nodo: el tamaño en modo relleno
 * depende de si la medida va en ese eje o en el otro.
 */
export function useParentDirection(): FlexDirection {
  const { parentId } = useNode((node) => ({ parentId: node.data.parent }));
  const { direction } = useEditor((state) => ({
    direction: parentId
      ? (state.nodes[parentId]?.data.props.direction as
          FlexDirection | undefined)
      : undefined,
  }));
  return direction ?? "column";
}
