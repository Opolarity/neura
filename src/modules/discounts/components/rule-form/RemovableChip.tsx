import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RemovableChipProps {
  label: string;
  onRemove: () => void;
}

/**
 * Chip de un elemento elegido, con su X para quitarlo. Vive dentro del trigger
 * del popover de los campos de reglas de precios.
 *
 * La X va como <span role="button"> y no como <Button> porque el chip está
 * dentro del botón que abre el popover, y un botón dentro de otro botón es
 * HTML inválido. El click se corta acá para que quitar un elemento no abra la
 * lista.
 */
export const RemovableChip = ({ label, onRemove }: RemovableChipProps) => (
  <Badge variant="secondary" className="gap-1 pr-1 text-xs font-normal">
    {label}
    <span
      role="button"
      tabIndex={0}
      aria-label={`Quitar ${label}`}
      className="rounded p-0.5 text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onRemove();
      }}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        e.stopPropagation();
        onRemove();
      }}
    >
      <X className="w-3 h-3" />
    </span>
  </Badge>
);
