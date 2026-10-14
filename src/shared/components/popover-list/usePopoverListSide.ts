import { useLayoutEffect, useRef, useState } from "react";
import { POPOVER_LIST_COLLISION_PADDING } from "@/shared/components/popover-list/popoverList";

// El sideOffset por defecto de PopoverContent (components/ui/popover).
const SIDE_OFFSET = 4;

/**
 * Lado por el que abre un popover de lista (abajo o arriba), decidido al abrir.
 *
 * Por qué no se deja a Radix: su `flip` mide el popover tal como está, y el
 * popover lleva un tope de alto igual al espacio disponible
 * (POPOVER_LIST_CONTENT_CLASS). En cuanto ese tope se calcula para el lado de
 * abajo, el popover se encoge a ese hueco, "cabe", y flip ya no lo sube nunca:
 * se abría encogido abajo aunque arriba hubiera sitio de sobra.
 *
 * La regla: abajo si cabe entero (`alturaCompleta`); si no, el lado con más
 * espacio, y ahí el tope de alto lo ajusta a lo que haya (descontando los 16px
 * reservados arriba). Radix recibe el lado ya decidido y, como el popover cabe,
 * no lo cambia.
 *
 * Se calcula en un layout effect: antes de que el navegador pinte, así que no se
 * ve el popover saltar de un lado a otro.
 */
export function usePopoverListSide(open: boolean, alturaCompleta: number) {
  // HTMLButtonElement por el tipo del ref de PopoverTrigger; solo se usa
  // getBoundingClientRect, así que vale cualquier elemento que haga de disparador.
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [side, setSide] = useState<"top" | "bottom">("bottom");

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const abajo = window.innerHeight - rect.bottom - SIDE_OFFSET - POPOVER_LIST_COLLISION_PADDING.bottom;
    const arriba = rect.top - SIDE_OFFSET - POPOVER_LIST_COLLISION_PADDING.top;
    setSide(abajo >= alturaCompleta || abajo >= arriba ? "bottom" : "top");
  }, [open, alturaCompleta]);

  return { triggerRef, side };
}
