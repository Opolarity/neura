import type { Category } from '@/types';

export interface CategoryNode extends Category {
  children: CategoryNode[];
  level: number;
}

/**
 * Convierte una lista plana de categorías en un árbol jerárquico
 */
export function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const categoryMap = new Map<number, CategoryNode>();
  const roots: CategoryNode[] = [];

  // Crear nodos para cada categoría
  categories.forEach(cat => {
    categoryMap.set(cat.id, { ...cat, children: [], level: 0 });
  });

  // Establecer relaciones padre-hijo y calcular niveles
  const calculateLevel = (node: CategoryNode): number => {
    if (!node.parent_category) return 0;
    const parent = categoryMap.get(node.parent_category);
    if (!parent) return 0;
    return calculateLevel(parent) + 1;
  };

  categories.forEach(cat => {
    const node = categoryMap.get(cat.id)!;
    node.level = calculateLevel(node);
    
    if (cat.parent_category && categoryMap.has(cat.parent_category)) {
      const parent = categoryMap.get(cat.parent_category)!;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Ordenar alfabéticamente en cada nivel
  const sortNodes = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach(node => {
      if (node.children.length > 0) {
        sortNodes(node.children);
      }
    });
  };

  sortNodes(roots);
  return roots;
}

/**
 * Aplana el árbol en una lista ordenada para renderizar
 */
export function flattenCategoryTree(nodes: CategoryNode[]): CategoryNode[] {
  const result: CategoryNode[] = [];
  
  const traverse = (nodes: CategoryNode[]) => {
    nodes.forEach(node => {
      result.push(node);
      if (node.children.length > 0) {
        traverse(node.children);
      }
    });
  };
  
  traverse(nodes);
  return result;
}
