import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
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
 * Etapa del chat como chip del encabezado: se lee de un vistazo y se cambia
 * al tocarla. Es el mismo Select de antes, con el trigger en forma de píldora.
 */
export const StageChip = ({ situation, situations, disabled, onChange }: Props) => (
  <Select
    value={situation ? String(situation.id) : undefined}
    onValueChange={(value) => onChange(Number(value))}
    disabled={disabled}
  >
    <SelectTrigger
      className="h-7 w-auto gap-1.5 rounded-full px-2.5 text-xs [&>svg]:h-3 [&>svg]:w-3 [&>svg]:opacity-60"
      aria-label="Etapa del chat"
      title="Etapa del chat"
    >
      <Dot statusCode={situation?.statusCode} />
      <span className="max-w-[120px] truncate">{situation?.name ?? "Sin etapa"}</span>
    </SelectTrigger>
    <SelectContent>
      {situations.map((s) => (
        <SelectItem key={s.id} value={String(s.id)} className="text-xs">
          <span className="flex items-center gap-2">
            <Dot statusCode={s.statusCode} />
            {s.name}
          </span>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
