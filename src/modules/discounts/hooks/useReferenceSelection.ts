import { useMemo, useState } from "react";

/**
 * Estado compartido de los campos de la regla que guardan ids pero se muestran
 * por nombre (productos, variaciones, categorías).
 *
 * De la regla guardada solo llegan los ids; el nombre de cada uno sale de
 * `byId` (lo que devolvió `references` en get-price-rule-details) o de lo que
 * el usuario acaba de elegir en el popover, que se recuerda en `picked`.
 *
 * Todo id termina con una opción: si no se puede resolver a un nombre — porque
 * el producto o la categoría ya no existe — se pinta un placeholder. Así nunca
 * queda un id guardado que el usuario no vea y no pueda quitar.
 */
export function useReferenceSelection<T extends { id: number }>(
  ids: number[],
  byId: Record<number, T>,
  makePlaceholder: (id: number) => T,
) {
  const [picked, setPicked] = useState<Record<number, T>>({});

  const selected = useMemo(
    () => ids.map((id) => picked[id] ?? byId[id] ?? makePlaceholder(id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids.join(","), picked, byId],
  );

  /** Guarda lo elegido en el popover para poder pintarlo por nombre. */
  const remember = (items: T[]) =>
    setPicked((prev) => {
      const next = { ...prev };
      items.forEach((item) => {
        next[item.id] = item;
      });
      return next;
    });

  return { selected, remember };
}
