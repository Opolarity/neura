import { cn } from "@/shared/utils/utils";
import { EditorTooltip } from "./editor-tooltip";

/** Qué es cada unidad que se ve dentro de un campo. */
const UNIT_NAMES: Record<string, string> = {
  mm: "Milímetros",
  pt: "Puntos tipográficos (1 pt = 1/72 de pulgada)",
  "%": "Porcentaje",
};

/**
 * La unidad que acompaña a un campo (mm, pt, %), con un tooltip que dice qué
 * es. `label` reemplaza el texto del tooltip cuando la unidad sola no lo
 * explica (la opacidad en %).
 */
export function UnitText({
  unit,
  label,
  className,
}: {
  unit: string;
  label?: string;
  className?: string;
}) {
  return (
    <EditorTooltip label={label ?? UNIT_NAMES[unit] ?? unit}>
      <span
        className={cn(
          "cursor-help text-[11px] text-muted-foreground",
          className,
        )}
      >
        {unit}
      </span>
    </EditorTooltip>
  );
}
