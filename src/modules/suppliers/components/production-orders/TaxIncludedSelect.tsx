import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/shared/utils/utils";
import { TAX_UNSET, TaxIncludedValue } from "../../utils/taxIncluded";

/**
 * El indicador de IGV de una línea, tal como lo pide Cotizaciones: si el
 * precio pactado ya lleva el IGV dentro, no lo lleva, o no se declaró.
 *
 * Solo ROTULA. El precio no se toca (ver `shared/utils/tax.ts`): lo que
 * cambia es qué desglose enseñan la Orden de Servicio y la Orden de Compra.
 *
 * Los valores y su traducción al backend viven en `utils/taxIncluded.ts`.
 */

interface TaxIncludedSelectProps {
  value: string;
  onValueChange: (value: TaxIncludedValue) => void;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  /** Alto de fila de rejilla (h-8), para ir al lado de un Input compacto. */
  compact?: boolean;
  className?: string;
}

export const TaxIncludedSelect = ({
  value,
  onValueChange,
  disabled,
  id,
  compact,
  className,
  "aria-label": ariaLabel,
}: TaxIncludedSelectProps) => (
  <Select
    value={value || TAX_UNSET}
    onValueChange={(next) => onValueChange(next as TaxIncludedValue)}
    disabled={disabled}
  >
    <SelectTrigger
      id={id}
      aria-label={ariaLabel}
      className={cn(compact && "h-8", className)}
    >
      <SelectValue placeholder="¿El precio incluye IGV?" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value={TAX_UNSET}>Sin declarar</SelectItem>
      <SelectItem value="true">El precio incluye IGV</SelectItem>
      {/* «+ IGV» y no «El precio no incluye IGV»: es como se dice al pactar
          --«cien más IGV»-- y en una celda de tabla la frase larga no cabia. */}
      <SelectItem value="false">+ IGV</SelectItem>
    </SelectContent>
  </Select>
);
