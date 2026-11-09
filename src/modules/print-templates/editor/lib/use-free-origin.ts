import { useEditor, useNode } from "@craftjs/core";
import type { PointMm } from "./style-props";
import { ZERO_SIDES, type Sides } from "./units";

/**
 * Desde dónde se cuenta, en la Hoja, el left/top de este componente si es
 * libre: el interior (dentro del borde) de su ancestro libre más cercano, que
 * es el que lo contiene con absolute; o la Hoja, que es el (0, 0).
 */
export function useFreeOrigin(): PointMm {
  const { id } = useNode();
  const { origin } = useEditor((state) => {
    let parentId = state.nodes[id]?.data.parent;
    while (parentId) {
      const parent = state.nodes[parentId];
      if (!parent) break;
      const props = parent.data.props;
      if (props.isPage) break;
      if (props.positionFree) {
        const border: Sides = props.borderWidth ?? ZERO_SIDES;
        return {
          origin: {
            x: (props.xMm ?? 0) + border.left,
            y: (props.yMm ?? 0) + border.top,
          },
        };
      }
      parentId = parent.data.parent;
    }
    return { origin: { x: 0, y: 0 } };
  });
  return origin;
}
