/**
 * Utilidades para manejo de estructuras jerárquicas (árboles)
 */

export interface TreeNode<T = unknown> {
  id: number;
  children: TreeNode<T>[];
  level: number;
}

export interface WithParent {
  id: number;
  parent_id?: number | null;
}

/**
 * Convierte una lista plana en un árbol jerárquico
 * @param items - Lista plana de elementos con parent_id
 * @param parentKey - Nombre de la propiedad que contiene el ID del padre (default: "parent_id")
 */
export function buildHierarchy<T extends { id: number; [key: string]: unknown }>(
  items: T[],
  parentKey: string = "parent_id"
): (T & TreeNode<T>)[] {
  type NodeType = T & TreeNode<T>;
  const itemMap = new Map<number, NodeType>();
  const roots: NodeType[] = [];

  // Crear nodos para cada elemento
  items.forEach((item) => {
    itemMap.set(item.id, { ...item, children: [], level: 0 } as NodeType);
  });

  // Función recursiva para calcular nivel
  const calculateLevel = (node: NodeType): number => {
    const parentId = node[parentKey] as number | null | undefined;
    if (!parentId) return 0;
    const parent = itemMap.get(parentId);
    if (!parent) return 0;
    return calculateLevel(parent) + 1;
  };

  // Establecer relaciones padre-hijo y calcular niveles
  items.forEach((item) => {
    const node = itemMap.get(item.id)!;
    node.level = calculateLevel(node);

    const parentId = item[parentKey] as number | null | undefined;
    if (parentId && itemMap.has(parentId)) {
      const parent = itemMap.get(parentId)!;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

/**
 * Aplana un árbol jerárquico en una lista ordenada (pre-order traversal)
 */
export function flattenHierarchy<T extends TreeNode>(nodes: T[]): T[] {
  const result: T[] = [];

  const traverse = (nodeList: T[]) => {
    nodeList.forEach((node) => {
      result.push(node);
      if (node.children.length > 0) {
        traverse(node.children as T[]);
      }
    });
  };

  traverse(nodes);
  return result;
}

/**
 * Ordena los nodos del árbol alfabéticamente por una propiedad
 */
export function sortHierarchy<T extends TreeNode & { [key: string]: unknown }>(
  nodes: T[],
  sortKey: string = "name"
): T[] {
  const sortNodes = (nodeList: T[]) => {
    nodeList.sort((a, b) => {
      const aVal = String(a[sortKey] ?? "");
      const bVal = String(b[sortKey] ?? "");
      return aVal.localeCompare(bVal);
    });
    nodeList.forEach((node) => {
      if (node.children.length > 0) {
        sortNodes(node.children as T[]);
      }
    });
  };

  sortNodes(nodes);
  return nodes;
}

/**
 * Encuentra un nodo por ID en el árbol
 */
export function findInHierarchy<T extends TreeNode>(
  nodes: T[],
  id: number
): T | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children.length > 0) {
      const found = findInHierarchy(node.children as T[], id);
      if (found) return found as T;
    }
  }
  return undefined;
}
