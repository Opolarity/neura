import { createContext, useContext } from "react";
import type { Node, NodeId, NodeTree, Nodes, useEditor } from "@craftjs/core";
import { getRandomId } from "@craftjs/utils";
import {
  PRINT_DATA_SOURCES,
  type PrintDataRow,
  type PrintDataSource,
  type PrintDataSourceId,
} from "../../constants/printDataSources";

/**
 * Lo que comparten la Tabla de datos y lo que lleva dentro.
 *
 * La Tabla tiene un Contenedor de encabezado y uno por fila, cada uno con un
 * Texto por columna, en el mismo orden. El encabezado y la primera fila son
 * nodos enlazados de craft (linked nodes); las demás filas son sus hijos y
 * repiten la primera con los datos de otro registro. Todas están en la
 * Estructura y se seleccionan.
 *
 * Las filas comparten el estilo: cambiar una fila, o el Texto de una columna
 * en una fila, cambia lo mismo en todas (sharedTargets). El ancho de una
 * columna también es el del Texto del encabezado.
 *
 * Todo lo de dentro va con `locked`: se le cambia el estilo, pero no se
 * copia, mueve, duplica ni elimina. Las columnas y las filas se manejan desde
 * el panel de la Tabla.
 */

/** Nombre del componente en el resolver (node.data.name). */
export const DATA_TABLE_NAME = "PdfDataTable";

/** Los nombres de los dos Contenedores enlazados de la Tabla. */
export const TABLE_PARTS = {
  title: "title",
  header: "header",
  row: "row",
  groupFooter: "groupFooter",
} as const;

/** Las fuentes que puede usar la plantilla abierta (su plantilla del sistema). */
export const DataSourcesContext = createContext<readonly PrintDataSource[]>([]);

export const useDataSources = () => useContext(DataSourcesContext);

/**
 * Las fuentes de un documento, con sus columnas iniciales en él si no son
 * las de la fuente (SystemPrintTemplate.dataColumns).
 */
export const sourcesOf = (
  ids: readonly PrintDataSourceId[] = [],
  columns: Partial<Record<PrintDataSourceId, readonly string[]>> = {},
): PrintDataSource[] =>
  ids.map((id) => ({
    ...PRINT_DATA_SOURCES[id],
    defaultColumns: columns[id] ?? PRINT_DATA_SOURCES[id].defaultColumns,
  }));

/**
 * La fuente `id` como la ve el documento abierto (con sus columnas
 * iniciales); una que el documento no ofrece, la del catálogo.
 */
export function useDocumentSource(id: PrintDataSourceId) {
  const sources = useDataSources();
  return (
    sources.find((source) => source.id === id) ??
    PRINT_DATA_SOURCES[id] ??
    PRINT_DATA_SOURCES.invoice_items
  );
}

/** El registro con que se dibuja una fila de la Tabla. */
export interface DataRowValue {
  source: PrintDataSource;
  row: PrintDataRow;
  /** El color de la fila, si a esta le toca (filas coloreadas). */
  stripe?: string;
}

export const DataRowContext = createContext<DataRowValue | null>(null);

/**
 * En una Tabla agrupada («Agrupar por»), lo que dice su título: el nombre
 * del primer grupo. Null fuera de eso.
 */
export const GroupTitleContext = createContext<string | null>(null);

/** Lo que agrupa a cada título de grupo que la Tabla agrega (lib/pagination). */
export const GROUP_HEADING_ATTR = "data-table-group";

/**
 * El origen «Grupo» de un Texto dentro del pie de grupo de una Tabla: el
 * nombre del grupo (GROUP_NAME_KEY) o un dato de su última fila.
 */
export const GROUP_SOURCE = "group";
export const GROUP_NAME_KEY = "__group";

/** Lo que muestra el pie de grupo de verdad: el del primer grupo. */
export const GroupFooterContext = createContext<{
  name: string;
  row: PrintDataRow;
  source: PrintDataSource;
} | null>(null);

/** Marca el texto de un dato del grupo: sus copias lo cambian por el suyo. */
export const GROUP_VALUE_ATTR = "data-group-value";

/**
 * Si un nodo va dentro del pie de grupo de una Tabla: la fuente de esa Tabla
 * (sus datos son los que ofrece el origen «Grupo»), o null.
 */
export function groupFooterSourceOf(nodes: Nodes, id: NodeId) {
  let current: NodeId | null | undefined = id;
  while (current) {
    const parentId: NodeId | null | undefined = nodes[current]?.data.parent;
    const parent = parentId ? nodes[parentId] : undefined;
    if (!parent) return null;
    if (
      parent.data.name === DATA_TABLE_NAME &&
      parent.data.linkedNodes[TABLE_PARTS.groupFooter] === current
    ) {
      const sourceId = parent.data.props.source as PrintDataSourceId;
      return PRINT_DATA_SOURCES[sourceId] ?? null;
    }
    current = parentId;
  }
  return null;
}

/** Marca el pie de un grupo, dentro del envoltorio de su última fila. */
export const GROUP_FOOTER_ATTR = "data-table-group-footer";

/** La clave del espacio arriba del título de grupo de una fila. */
export const groupPushKey = (rowId: string) => `group:${rowId}`;

export const useDataRow = () => useContext(DataRowContext);

/**
 * El registro de ejemplo de la fila `index`: si hay más filas que ejemplos,
 * se vuelven a usar desde el primero.
 */
export const sampleRowAt = (source: PrintDataSource, index: number) =>
  source.mockRows[index % source.mockRows.length];

/** La Tabla de datos de la que forma parte un nodo, si alguna. */
export function tableOf(nodes: Nodes, id: NodeId): NodeId | null {
  let parentId = nodes[id]?.data.parent;
  while (parentId) {
    const parent = nodes[parentId];
    if (!parent) return null;
    if (parent.data.name === DATA_TABLE_NAME) return parentId;
    parentId = parent.data.parent;
  }
  return null;
}

/** Las filas de una Tabla, en orden: la enlazada y después sus hijos. */
export function tableRows(nodes: Nodes, tableId: NodeId): NodeId[] {
  const table = nodes[tableId];
  const first = table?.data.linkedNodes[TABLE_PARTS.row];
  return first ? [first, ...table.data.nodes] : [];
}

/** Qué es un Contenedor dentro de su Tabla: el título, el encabezado o una fila. */
function tablePartOf(
  nodes: Nodes,
  id: NodeId,
): "title" | "header" | "row" | "groupFooter" | null {
  const parent = nodes[nodes[id]?.data.parent ?? ""];
  if (parent?.data.name !== DATA_TABLE_NAME) return null;
  if (parent.data.linkedNodes[TABLE_PARTS.title] === id) return "title";
  if (parent.data.linkedNodes[TABLE_PARTS.groupFooter] === id)
    return "groupFooter";
  return parent.data.linkedNodes[TABLE_PARTS.header] === id ? "header" : "row";
}

/** Lo que es el ancho: en una Tabla de datos, es el de toda la columna. */
const WIDTH_KEYS: readonly string[] = ["widthMode", "widthMm"];

/**
 * Los nodos que cambian `key` junto con `id` (él incluido). Una fila: todas
 * las filas. El Texto de una columna en una fila: el de esa columna en todas
 * las filas. El ancho de una columna: también el Texto del encabezado. Fuera
 * de una Tabla, solo él.
 */
export function sharedTargets(nodes: Nodes, id: NodeId, key: string): NodeId[] {
  const parentId = nodes[id]?.data.parent;
  if (!parentId) return [id];
  if (tablePartOf(nodes, id) === "row") return tableRows(nodes, parentId);

  const part = tablePartOf(nodes, parentId);
  const tableId = nodes[parentId].data.parent;
  // El título y el pie de grupo no son columnas: cambia solo él.
  if (!part || part === "title" || part === "groupFooter" || !tableId)
    return [id];
  const headerId = nodes[tableId].data.linkedNodes[TABLE_PARTS.header];
  const rows = tableRows(nodes, tableId);
  const parts = WIDTH_KEYS.includes(key)
    ? [headerId, ...rows]
    : part === "row"
      ? rows
      : [headerId];
  const index = nodes[parentId].data.nodes.indexOf(id);
  const targets = parts
    .map((partId) => nodes[partId]?.data.nodes[index])
    .filter((target): target is NodeId => Boolean(target));
  return targets.includes(id) ? targets : [id, ...targets];
}

/** La fuente de la Tabla de la que forma parte un nodo, si alguna. */
export function tableSourceOf(nodes: Nodes, id: NodeId) {
  const tableId = tableOf(nodes, id);
  const sourceId = tableId
    ? (nodes[tableId].data.props.source as PrintDataSourceId | undefined)
    : undefined;
  return sourceId ? PRINT_DATA_SOURCES[sourceId] : null;
}

type EditorQuery = ReturnType<typeof useEditor>["query"];

/**
 * Una copia del árbol de `id` con ids nuevos, colgando de `parentId`: una
 * fila nueva igual a la primera.
 */
export function cloneTree(
  query: EditorQuery,
  id: NodeId,
  parentId: NodeId,
): NodeTree {
  const nodes: Record<NodeId, Node> = {};
  const rebuild = (oldId: NodeId, newParentId: NodeId): NodeId => {
    const serialized = query.node(oldId).toSerializedNode();
    const newId = getRandomId();
    const childIds = serialized.nodes.map((childId) => rebuild(childId, newId));
    nodes[newId] = query
      .parseSerializedNode({
        ...serialized,
        parent: newParentId,
        nodes: childIds,
        linkedNodes: {},
      })
      .toNode((node) => {
        node.id = newId;
      });
    return newId;
  };
  return { rootNodeId: rebuild(id, parentId), nodes };
}
