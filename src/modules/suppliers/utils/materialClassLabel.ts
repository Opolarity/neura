import { MaterialClass } from "../types/materials.types";

/**
 * Cómo se nombra una clase de material teniendo en cuenta de dónde cuelga:
 * «TELA › JERSEY › DENIM».
 *
 * Vive aquí y no en la pantalla para que el selector y el resto la nombren
 * igual. Sin esto, `parent_class_id` se guardaría y no se notaría en ninguna
 * parte -- que es exactamente como llevaba la columna hasta que se empezó a
 * escribir.
 *
 * Recorre la cadena ENTERA. Antes pintaba solo el salto inmediato porque no
 * había ni un caso con dos niveles; con el árbol de varios niveles ese motivo
 * desaparece, y quedarse en el padre inmediato mostraría «JERSEY › DENIM»
 * ocultando de qué familia es.
 *
 * `vistos` es el tope contra ciclos: un `parent_class_id` que apunte a un
 * ancestro colgaría el bucle, y nada en la base lo impide.
 */
export const materialClassLabel = (
  cls: MaterialClass,
  classes: MaterialClass[],
): string => {
  const ruta: string[] = [cls.name];
  const vistos = new Set<number>([cls.id]);
  let actual: MaterialClass | undefined = cls;

  while (actual?.parent_class_id) {
    const padre: MaterialClass | undefined = classes.find(
      (c) => c.id === actual!.parent_class_id,
    );
    // Un padre que no está en la lista -- otro módulo, o borrado -- corta la
    // ruta en vez de dejar la clase sin nombre.
    if (!padre || vistos.has(padre.id)) break;
    vistos.add(padre.id);
    ruta.unshift(padre.name);
    actual = padre;
  }

  return ruta.join(" › ");
};
