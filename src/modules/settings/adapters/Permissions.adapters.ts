import {
  PermissionCatalogApiItem,
  PermissionCatalogItem,
  PermissionNode,
  PermissionTree,
  PermissionsCatalogApiResponse,
} from "../types/Permissions.types";

/**
 * Tope de profundidad del árbol. No es un límite de negocio: es el cortafuegos
 * que evita un bucle infinito si `parent_id` quedara mal poblado en BD.
 */
const MAX_DEPTH = 20;

/**
 * Arma el árbol de todo el catálogo de permisos.
 *
 * Reglas de robustez — un `parent_id` mal poblado NUNCA debe ocultar un
 * permiso: si se ocultara, su checkbox no existiría, su id no entraría en el
 * array que se envía al guardar y `sp_set_role_permissions` lo borraría en
 * silencio. Por eso todos estos casos degradan el nodo a raíz en vez de
 * descartarlo:
 *   - el padre no está en el catálogo (fila inactiva);
 *   - autorreferencia (`parent_id === id`);
 *   - ciclo o profundidad excedida.
 */
const buildForest = (items: PermissionCatalogItem[]) => {
  const byId = new Map(items.map((item) => [item.id, item]));

  // Padre efectivo: descarta autorreferencias y referencias fuera del catálogo.
  const parentOf = new Map<number, number | null>();
  items.forEach((item) => {
    const parentId = item.parentId;
    const valid =
      parentId !== null && parentId !== item.id && byId.has(parentId);
    parentOf.set(item.id, valid ? parentId : null);
  });

  // Rompe ciclos y cadenas demasiado largas dejando el nodo como raíz.
  items.forEach((item) => {
    const seen = new Set<number>([item.id]);
    let current = parentOf.get(item.id) ?? null;
    let depth = 0;

    while (current !== null) {
      if (seen.has(current) || depth >= MAX_DEPTH) {
        parentOf.set(item.id, null);
        break;
      }
      seen.add(current);
      current = parentOf.get(current) ?? null;
      depth += 1;
    }
  });

  const nodes = new Map<number, PermissionNode>(
    items.map((item) => [
      item.id,
      { id: item.id, code: item.code, name: item.name, children: [] },
    ])
  );

  // El orden de `items` viene de la RPC (ORDER BY code), así que raíces
  // e hijos quedan alfabéticos por `code` sin ordenar de nuevo.
  const roots: PermissionNode[] = [];
  items.forEach((item) => {
    const node = nodes.get(item.id)!;
    const parentId = parentOf.get(item.id);

    if (parentId === null || parentId === undefined) {
      roots.push(node);
    } else {
      nodes.get(parentId)!.children.push(node);
    }
  });

  const descendantsOf = new Map<number, number[]>();
  const collect = (node: PermissionNode): number[] => {
    const descendants = node.children.flatMap((child) => [
      child.id,
      ...collect(child),
    ]);
    descendantsOf.set(node.id, descendants);
    return descendants;
  };
  roots.forEach(collect);

  return { roots, parentOf, descendantsOf };
};

export const permissionsCatalogAdapter = (
  response: PermissionsCatalogApiResponse
): PermissionTree => {
  const items: PermissionCatalogItem[] = (response.permissions ?? []).map(
    (item: PermissionCatalogApiItem) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      type: item.type,
      parentId: item.parent_id ?? null,
    })
  );

  const forest = buildForest(items);

  return {
    permissions: forest.roots,
    allPermissionIds: items.map((item) => item.id),
    parentOf: forest.parentOf,
    descendantsOf: forest.descendantsOf,
  };
};
