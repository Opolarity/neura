/**
 * Popovers con una lista que carga de la red (buscadores de productos y
 * categorías): se reservan 16px por arriba para que no toquen el borde de la
 * pantalla, y su alto nunca pasa del espacio que queda (Radix lo calcula ya
 * descontando ese margen), así que no se cortan. El buscador y el pie se quedan
 * fijos (`shrink-0`) y lo que se recorta es la lista (`min-h-0 flex-1`).
 *
 * Mismo criterio que el select de personalizado:
 * max-h-[min(24rem,var(--radix-select-content-available-height))].
 */
export const POPOVER_LIST_COLLISION_PADDING = { top: 16, right: 8, bottom: 8, left: 8 };

/** Para el PopoverContent; el ancho lo pone cada uso. */
export const POPOVER_LIST_CONTENT_CLASS =
  "flex flex-col p-0 max-h-[var(--radix-popover-content-available-height)]";
