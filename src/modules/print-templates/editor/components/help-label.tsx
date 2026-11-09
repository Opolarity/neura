import type { ReactNode } from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * El nombre de una propiedad con su icono de ayuda a la derecha, para los
 * label de PanelField. Mismo icono y tooltip que FieldLabel con `help` (el de
 * los campos sin PanelField), así todos se ven igual.
 */
export function HelpLabel({
  label,
  help,
}: {
  label: ReactNode;
  help?: ReactNode;
}) {
  if (!help) return <>{label}</>;
  return (
    <>
      {label}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Ayuda"
            // Dentro del label, un clic aquí no debe llevar el foco al campo.
            onClick={(event) => event.preventDefault()}
            className="cursor-help text-muted-foreground hover:text-foreground"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-[12px]">
          {help}
        </TooltipContent>
      </Tooltip>
    </>
  );
}
