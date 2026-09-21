import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/shared/utils/utils";

/**
 * La moneda pactada de una cotización, por código ISO.
 *
 * Dos opciones y no un catálogo mantenible: el negocio compra en soles y en
 * dólares, y una pantalla de administración para dos filas es más trabajo del
 * que ahorra. La columna acepta cualquier código de tres letras, así que
 * sumar una tercera es añadir una línea aquí.
 *
 * Rige toda la cotización —un proveedor, una negociación— y es lo que
 * imprimen la Orden de Servicio y la de Compra en cada importe.
 */
export const MONEDAS = [
  { code: "PEN", label: "Soles (S/)" },
  { code: "USD", label: "Dólares ($)" },
] as const;

interface CurrencySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  /** Alto de fila de rejilla (h-8), para ir al lado de un Input compacto. */
  compact?: boolean;
  className?: string;
}

export const CurrencySelect = ({
  value,
  onValueChange,
  disabled,
  id,
  compact,
  className,
  "aria-label": ariaLabel,
}: CurrencySelectProps) => (
  <Select value={value || "PEN"} onValueChange={onValueChange} disabled={disabled}>
    <SelectTrigger
      id={id}
      aria-label={ariaLabel}
      className={cn(compact && "h-8", className)}
    >
      <SelectValue placeholder="Moneda" />
    </SelectTrigger>
    <SelectContent>
      {MONEDAS.map((moneda) => (
        <SelectItem key={moneda.code} value={moneda.code}>
          {moneda.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
