import { MaterialClass } from "../types/materials.types";

export interface MaterialClassNode extends MaterialClass {
  children: MaterialClassNode[];
  level: number;
}

/**
 * Convierte la lista plana de clases en un árbol jerárquico.
 *
 * Espejo de `products/utils/categoryTree.ts`, que es el util que alimenta el
 * panel de categorías del formulario de producto. No se reutiliza aquél
 * porque está tipado a `Category` y lee `parent_category`; aquí la columna es
 * `parent_class_id`.
 *
 * Un padre que no está en la lista -- otro módulo, o borrado -- deja a su hija
 * como raíz en vez de perderla.
 */
export function buildMaterialClassTree(
  classes: MaterialClass[],
): MaterialClassNode[] {
  const porId = new Map<number, MaterialClassNode>();
  const raices: MaterialClassNode[] = [];

  classes.forEach((cls) => {
    porId.set(cls.id, { ...cls, children: [], level: 0 });
  });

  // Se sube por la cadena de padres contando saltos. `vistos` es el tope: un
  // parent_class_id que apunte a un ancestro colgaría el bucle, y nada en la
  // base lo impide.
  //
  // `enCiclo` no es un adorno: si A cuelga de B y B de A, cada uno acaba en los
  // hijos del otro y NINGUNO queda como raíz -- el recorrido nunca los alcanza
  // y desaparecen del selector sin dejar rastro. Marcados así, se cuelgan de la
  // raíz y siguen siendo elegibles.
  const ascender = (nodo: MaterialClassNode) => {
    let nivel = 0;
    const vistos = new Set<number>([nodo.id]);
    let actual = nodo;

    while (actual.parent_class_id) {
      const padre = porId.get(actual.parent_class_id);
      if (!padre) break;
      if (vistos.has(padre.id)) return { nivel: 0, enCiclo: true };
      vistos.add(padre.id);
      nivel += 1;
      actual = padre;
    }

    return { nivel, enCiclo: false };
  };

  classes.forEach((cls) => {
    const nodo = porId.get(cls.id)!;
    const { nivel, enCiclo } = ascender(nodo);
    nodo.level = nivel;

    const padre = cls.parent_class_id ? porId.get(cls.parent_class_id) : undefined;
    if (padre && !enCiclo) {
      padre.children.push(nodo);
    } else {
      raices.push(nodo);
    }
  });

  const ordenar = (nodos: MaterialClassNode[]) => {
    nodos.sort((a, b) => a.name.localeCompare(b.name));
    nodos.forEach((nodo) => ordenar(nodo.children));
  };

  ordenar(raices);
  return raices;
}

/** Aplana el árbol en el orden en que se pinta: cada padre seguido de los suyos. */
export function flattenMaterialClassTree(
  nodos: MaterialClassNode[],
): MaterialClassNode[] {
  const salida: MaterialClassNode[] = [];

  const recorrer = (lista: MaterialClassNode[]) => {
    lista.forEach((nodo) => {
      salida.push(nodo);
      recorrer(nodo.children);
    });
  };

  recorrer(nodos);
  return salida;
}
