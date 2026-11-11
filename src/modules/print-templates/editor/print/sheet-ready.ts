import { ROOT_NODE, type NodeId, type Nodes } from "@craftjs/core";
import type { PrintDataSourceId } from "../../constants/printDataSources";
import { rowsOf, type PrintData } from "../lib/print-data";
import { DATA_TABLE_NAME } from "../lib/data-table";

/**
 * El siguiente cuadro; si la pestaña queda en segundo plano (el navegador no
 * da cuadros ahí), a más tardar en 50 ms.
 */
export const nextFrame = () =>
  new Promise<void>((resolve) => {
    const timer = window.setTimeout(resolve, 50);
    requestAnimationFrame(() => {
      window.clearTimeout(timer);
      resolve();
    });
  });

/** El tope de filas de ejemplo de una Tabla (components/pdf-data-table). */
const MAX_TABLE_ROWS = 40;

/**
 * Si la hoja ya está armada: cada componente que se dibuja tiene su elemento
 * (los ocultos y lo que va dentro de ellos no se dibujan) y cada Tabla de
 * datos ya tiene sus filas: las de ejemplo o, al imprimir, las del documento
 * (las agrega o quita después de dibujarse).
 */
export const sheetReady = (nodes: Nodes, data: PrintData | null) => {
  if (!nodes[ROOT_NODE]?.dom) return false;
  const hidden = (id: NodeId | null | undefined): boolean => {
    for (let current = id; current; current = nodes[current]?.data.parent)
      if (nodes[current]?.data.hidden) return true;
    return false;
  };
  return Object.entries(nodes).every(([id, node]) => {
    if (hidden(id)) return true;
    if (!node.dom) return false;
    if (node.data.name !== DATA_TABLE_NAME) return true;
    const real = rowsOf(data, node.data.props.source as PrintDataSourceId);
    if (real) return node.data.nodes.length === Math.max(0, real.length - 1);
    const rows = Math.max(1, Number(node.data.props.sampleRows) || 1);
    return node.data.nodes.length + 1 >= Math.min(rows, MAX_TABLE_ROWS);
  });
};
