import { Check, Flag } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/shared/utils/utils";
import type { Situation } from "../types/crm.types";

interface Props {
  situation: Situation | null;
  situations: Situation[];
  disabled?: boolean;
  onChange: (situationId: number) => void;
}

/** Punto de color por estado macro de la etapa: el mismo vocabulario que Ventas. */
const dotClass = (statusCode: string | null | undefined) =>
  statusCode === "COM"
    ? "bg-success"
    : statusCode === "CAN"
      ? "bg-destructive"
      : statusCode === "PEN"
        ? "bg-primary"
        : "bg-muted-foreground";

const Dot = ({ statusCode }: { statusCode?: string | null }) => (
  <span className={cn("h-2 w-2 shrink-0 rounded-full", dotClass(statusCode))} aria-hidden="true" />
);

/**
 * Submenú "Etapa" del menú ⋯ del chat: muestra la etapa actual y se cambia
 * desde el mismo lugar.
 */
export const StageSubmenu = ({ situation, situations, disabled, onChange }: Props) => (
  <DropdownMenuSub>
    <DropdownMenuSubTrigger
      className="items-start gap-2 text-xs [&>svg:last-child]:h-3.5 [&>svg:last-child]:w-3.5"
      disabled={disabled}
    >
      <Flag className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-medium">Etapa</span>
          <span className="ml-auto flex max-w-[110px] items-center gap-1.5 text-muted-foreground">
            <Dot statusCode={situation?.statusCode} />
            <span className="truncate">{situation?.name ?? "Sin etapa"}</span>
          </span>
        </span>
        <span className="block text-[11px] text-muted-foreground">La columna del tablero del CRM.</span>
      </span>
    </DropdownMenuSubTrigger>
    <DropdownMenuSubContent className="max-h-72 w-52 overflow-y-auto">
      {situations.map((s) => (
        <DropdownMenuItem key={s.id} className="gap-2 text-xs" onSelect={() => onChange(s.id)}>
          <Check className={cn("h-3.5 w-3.5 shrink-0", s.id === situation?.id ? "opacity-100" : "opacity-0")} />
          <Dot statusCode={s.statusCode} />
          {s.name}
        </DropdownMenuItem>
      ))}
    </DropdownMenuSubContent>
  </DropdownMenuSub>
);
