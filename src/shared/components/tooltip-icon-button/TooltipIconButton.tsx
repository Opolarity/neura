import * as React from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/shared/utils/utils";

export interface TooltipIconButtonProps
  extends Omit<ButtonProps, "size" | "asChild"> {
  /** Icono del botón, sin color propio (lo pone la variante). Puede cambiar entre renders (p. ej. un spinner mientras exporta). */
  icon: React.ReactNode;
  /** Qué hace el botón: es el texto del tooltip y el aria-label. */
  label: string;
}

// El tooltip se abre con el foco solo cuando ese foco es de teclado
// (:focus-visible, el mismo criterio del anillo de foco). Así no queda abierto
// cuando un Dialog devuelve el foco a su DialogTrigger tras cerrarlo con el
// ratón: Radix Tooltip lo abriría porque ese foco no viene de un clic sobre
// el propio botón. Con Tab sigue apareciendo.
const isKeyboardFocus = (element: Element) => {
  try {
    return element.matches(":focus-visible");
  } catch {
    return true;
  }
};

/**
 * Botón de barra solo con icono y tooltip (T-1010). Para acciones con icono
 * universal (filtrar, exportar); la acción principal (crear/agregar) conserva
 * su texto. Pasa ref y props al Button interno, así funciona dentro de un
 * DialogTrigger asChild. `children` se pinta junto al icono (p. ej. el punto
 * de filtros activos, posicionado en absoluto).
 */
export const TooltipIconButton = React.forwardRef<
  HTMLButtonElement,
  TooltipIconButtonProps
>(({ icon, label, className, children, ...props }, ref) => (
  <Tooltip>
    <TooltipTrigger
      asChild
      onFocus={(event) => {
        if (!isKeyboardFocus(event.currentTarget)) event.preventDefault();
      }}
    >
      <Button
        ref={ref}
        size="icon"
        aria-label={label}
        className={cn("relative shrink-0", className)}
        {...props}
      >
        {icon}
        {children}
      </Button>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
));
TooltipIconButton.displayName = "TooltipIconButton";
