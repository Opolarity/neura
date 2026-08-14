import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import {
  parseLocalDate,
  toDateInputValue,
  formatDateDisplay,
  getTodayDate,
} from "@/shared/utils/date";

export interface DateFieldProps {
  /** Día de calendario "YYYY-MM-DD" (nunca un Date ni un timestamp). */
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  /** Tope inferior "YYYY-MM-DD". */
  minDate?: string;
  /** Tope superior "YYYY-MM-DD". Por defecto hoy en Lima. */
  maxDate?: string;
  disabled?: boolean;
  /** Muestra una X para volver a "sin fecha". */
  showClear?: boolean;
  className?: string;
}

/**
 * Selector de una sola fecha con el estilo de los filtros de Ventas:
 * botón outline + popover con el calendario. Para rangos usar DateRangeFilter.
 */
const DateField = ({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  minDate,
  maxDate = getTodayDate(),
  disabled = false,
  showClear = false,
  className,
}: DateFieldProps) => {
  const selected = value ? parseLocalDate(value) : undefined;

  // Un matcher por tope: `{ before: undefined }` no es un matcher válido.
  const disabledDays = [
    ...(minDate ? [{ before: parseLocalDate(minDate) }] : []),
    ...(maxDate ? [{ after: parseLocalDate(maxDate) }] : []),
  ];

  return (
    <div className={cn("relative", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              showClear && value && "pr-9",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            {value ? formatDateDisplay(value) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => onChange(date ? toDateInputValue(date) : null)}
            disabled={disabledDays}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {showClear && value && !disabled && (
        <button
          type="button"
          aria-label="Limpiar fecha"
          onClick={() => onChange(null)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

export default DateField;
