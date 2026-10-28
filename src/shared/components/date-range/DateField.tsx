import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, X } from "lucide-react";
import { es } from "date-fns/locale";
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
  /**
   * Tope superior "YYYY-MM-DD". Por defecto hoy en Lima, porque este campo
   * nació para filtrar sobre lo que ya ocurrió.
   *
   * `null` = sin tope, para los campos que miran al futuro: una entrega se
   * compromete para dentro de tres semanas. Hace falta decirlo así y no
   * omitir la prop, porque el valor por defecto también se aplica cuando se
   * pasa `undefined`.
   */
  maxDate?: string | null;
  disabled?: boolean;
  /** Muestra una X para volver a "sin fecha". */
  showClear?: boolean;
  /**
   * Id del disparador, para que un `<Label htmlFor>` apunte a algo. Sin esto,
   * el rótulo de un formulario queda huérfano: no enfoca al pulsarlo y el
   * lector de pantalla no lo asocia.
   */
  id?: string;
  className?: string;
  /** Clases del botón disparador, p. ej. la versión compacta `h-8 text-xs`. */
  triggerClassName?: string;
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
  id,
  className,
  triggerClassName,
}: DateFieldProps) => {
  const selected = value ? parseLocalDate(value) : undefined;

  // Un matcher por tope: `{ before: undefined }` no es un matcher válido.
  const disabledDays = [
    ...(minDate ? [{ before: parseLocalDate(minDate) }] : []),
    ...(maxDate ? [{ after: parseLocalDate(maxDate) }] : []),
  ];

  // Los desplegables de mes/año de rdp solo aparecen con ambos extremos, así
  // que sin tope se acota a una ventana razonable alrededor del año en Lima
  // (ampliada si el valor ya guardado cae fuera, para poder volver a él).
  const currentYear = Number(getTodayDate().slice(0, 4));
  const fallbackFrom = `${currentYear - 10}-01-01`;
  const fallbackTo = `${currentYear + 5}-12-31`;
  const fromDate = parseLocalDate(
    minDate ?? (value && value < fallbackFrom ? value : fallbackFrom)
  );
  const toDate = parseLocalDate(
    maxDate ?? (value && value > fallbackTo ? value : fallbackTo)
  );

  return (
    <div className={cn("relative", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              showClear && value && "pr-9",
              !value && "text-muted-foreground",
              triggerClassName
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            {value ? formatDateDisplay(value) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            locale={es}
            captionLayout="dropdown-buttons"
            fromDate={fromDate}
            toDate={toDate}
            selected={selected}
            // Sin valor, abre en el tope inferior: el "Hasta" de un rango
            // arranca en el mes del "Desde" en vez del mes actual.
            defaultMonth={selected ?? (minDate ? fromDate : undefined)}
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
