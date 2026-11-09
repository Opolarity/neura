import type { ReactElement, ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * El tooltip del editor (el de shadcn, nunca el `title` del navegador). El
 * hijo es el disparador: un único elemento que acepte ref. Sin `label` no
 * hay tooltip y el hijo queda tal cual. Para apagarlo un rato sin que el hijo
 * se vuelva a montar (cambiaría el árbol), `disabled`.
 */
export function EditorTooltip({
  label,
  side,
  disabled = false,
  children,
}: {
  label?: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  disabled?: boolean;
  children: ReactElement;
}) {
  if (!label) return children;
  return (
    <Tooltip open={disabled ? false : undefined}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className="px-2 py-1 text-[11px]">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
