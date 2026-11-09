import { useEffect, useState } from "react";
import { useNode } from "@craftjs/core";
import { pxToMm } from "./units";

export interface SizeMm {
  width: number;
  height: number;
}

/**
 * Lo que mide de verdad el nodo en la hoja, en mm, y se actualiza al cambiar.
 * Sale del estilo calculado y no del rectángulo en pantalla, así el zoom del
 * lienzo (un transform) no lo altera.
 */
export function useNodeSizeMm(): SizeMm | null {
  const { dom } = useNode((node) => ({ dom: node.dom }));
  const [size, setSize] = useState<SizeMm | null>(null);

  useEffect(() => {
    if (!dom) return;
    const measure = () => {
      const style = getComputedStyle(dom);
      setSize({
        width: pxToMm(parseFloat(style.width)),
        height: pxToMm(parseFloat(style.height)),
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(dom);
    return () => observer.disconnect();
  }, [dom]);

  return size;
}
