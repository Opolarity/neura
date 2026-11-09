import { useEditor, useNode } from "@craftjs/core";
import { sharedTargets } from "./data-table";

/** Cambia una propiedad del nodo seleccionado. */
export type PropSetter<P> = <K extends keyof P>(key: K, value: P[K]) => void;

/**
 * Las props del nodo, completadas con sus valores por defecto (un diseño
 * guardado antes de que existiera una propiedad no la trae), y un setter por
 * clave para los paneles.
 *
 * Dentro de una Tabla de datos el setter cambia también los nodos que
 * comparten esa propiedad: las otras filas, o la columna entera si es el
 * ancho (lib/data-table).
 */
export function useNodeProps<P extends object>(defaults: P) {
  const { id, props } = useNode((node) => ({
    props: { ...defaults, ...node.data.props } as P,
  }));
  const { actions, query } = useEditor();

  const set: PropSetter<P> = (key, value) =>
    actions.setProp(
      sharedTargets(query.getNodes(), id, String(key)),
      (draft: P) => {
        draft[key] = value;
      },
    );

  return { props, set };
}
