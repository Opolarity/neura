import { Input } from "@/components/ui/input";
import { cn } from "@/shared/utils/utils";
import DateField from "./DateField";

export interface DateTimeFieldProps {
  /** "YYYY-MM-DDTHH:mm" en hora de Lima, o null. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** Tope del día; por defecto hoy (como DateField). `null` = sin tope. */
  maxDate?: string | null;
  minDate?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/**
 * Fecha + hora con el selector de fecha de la marca (DateField) y un campo de
 * hora. El valor viaja como "YYYY-MM-DDTHH:mm" de Lima: la conversión a
 * instante va por `limaDateTimeLocalToIso` (shared/utils/date.ts) o por
 * `fn_lima_ts` en la base. Reemplaza al `<input type="datetime-local">`.
 */
const DateTimeField = ({ value, onChange, maxDate, minDate, disabled, id, className }: DateTimeFieldProps) => {
  const [date, time] = value ? value.split("T") : [null, null];

  const emit = (d: string | null, t: string | null) => {
    if (!d) return onChange(null);
    onChange(`${d}T${t && /^\d{2}:\d{2}$/.test(t) ? t : "00:00"}`);
  };

  return (
    <div className={cn("flex gap-2", className)}>
      <DateField
        id={id}
        className="flex-1"
        value={date}
        onChange={(d) => emit(d, time)}
        maxDate={maxDate}
        minDate={minDate}
        disabled={disabled}
      />
      <Input
        type="time"
        aria-label="Hora"
        className="w-[120px]"
        value={time ?? ""}
        disabled={disabled || !date}
        onChange={(e) => emit(date, e.target.value)}
      />
    </div>
  );
};

export default DateTimeField;
