import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/shared/utils/utils";
import {
  addCalendarDays,
  diffCalendarDays,
  getFirstDayOfMonth,
  getTodayDate,
} from "@/shared/utils/date";
import DateField from "./DateField";

export interface DateRangeValue {
  startDate: string | null;
  endDate: string | null;
}

export interface DateRangeFilterProps extends DateRangeValue {
  onChange: (range: DateRangeValue) => void;
  startLabel?: string;
  endLabel?: string;
  /** Atajos rápidos (Hoy, Últimos 7 días, …). */
  showPresets?: boolean;
  /** Máximo de días entre "desde" y "hasta". Acota el calendario y los presets. */
  maxRangeDays?: number;
  /** Tope inferior duro "YYYY-MM-DD". */
  minDate?: string;
  /** Tope superior "YYYY-MM-DD". Por defecto hoy en Lima. */
  maxDate?: string;
  /** "grid" = dos columnas (modales) · "inline" = fila compacta (barras de filtros). */
  layout?: "grid" | "inline";
  disabled?: boolean;
  className?: string;
}

// Todo se calcula sobre "YYYY-MM-DD" con los helpers de Lima: nada de
// aritmética de Date, que dependería de la zona del navegador.
const buildPresets = (): { label: string; range: DateRangeValue }[] => {
  const today = getTodayDate();
  const firstOfThisMonth = getFirstDayOfMonth();
  const lastOfPrevMonth = addCalendarDays(firstOfThisMonth, -1);
  const firstOfPrevMonth = `${lastOfPrevMonth.slice(0, 7)}-01`;

  return [
    { label: "Hoy", range: { startDate: today, endDate: today } },
    {
      label: "Últimos 7 días",
      range: { startDate: addCalendarDays(today, -6), endDate: today },
    },
    {
      label: "Este mes",
      range: { startDate: firstOfThisMonth, endDate: today },
    },
    {
      label: "Mes pasado",
      range: { startDate: firstOfPrevMonth, endDate: lastOfPrevMonth },
    },
  ];
};

/**
 * Selector de rango de fechas del ERP — el mismo control en todos los filtros.
 * Trabaja siempre con días de calendario "YYYY-MM-DD"; la conversión a/desde
 * Date vive en shared/utils/date.
 */
const DateRangeFilter = ({
  startDate,
  endDate,
  onChange,
  startLabel = "Fecha Desde",
  endLabel = "Fecha Hasta",
  showPresets = true,
  maxRangeDays,
  minDate,
  maxDate = getTodayDate(),
  layout = "grid",
  disabled = false,
  className,
}: DateRangeFilterProps) => {
  // Tope del "hasta": el que imponga el módulo o el que imponga maxRangeDays.
  const endMaxDate =
    startDate && maxRangeDays !== undefined
      ? [addCalendarDays(startDate, maxRangeDays), maxDate]
          .filter(Boolean)
          .sort()[0]
      : maxDate;

  const fitsLimits = (range: DateRangeValue) => {
    const { startDate: from, endDate: to } = range;
    if (!from || !to) return false;
    if (minDate && from < minDate) return false;
    if (maxDate && to > maxDate) return false;
    if (maxRangeDays !== undefined && diffCalendarDays(from, to) > maxRangeDays)
      return false;
    return true;
  };

  const presets = showPresets
    ? buildPresets().filter((preset) => fitsLimits(preset.range))
    : [];

  const handleStartChange = (value: string | null) => {
    // Si el nuevo "desde" deja al "hasta" fuera de rango, se limpia.
    const outOfRange =
      value &&
      endDate &&
      (endDate < value ||
        (maxRangeDays !== undefined &&
          diffCalendarDays(value, endDate) > maxRangeDays));

    onChange({ startDate: value, endDate: outOfRange ? null : endDate });
  };

  const handleEndChange = (value: string | null) =>
    onChange({ startDate, endDate: value });

  const isInline = layout === "inline";

  return (
    <div className={cn(isInline ? "space-y-2" : "space-y-3", className)}>
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => {
            const isActive =
              startDate === preset.range.startDate &&
              endDate === preset.range.endDate;
            return (
              <Button
                key={preset.label}
                type="button"
                size="sm"
                variant={isActive ? "default" : "outline"}
                className="h-7 px-2.5 text-xs font-normal"
                disabled={disabled}
                onClick={() => onChange(preset.range)}
              >
                {preset.label}
              </Button>
            );
          })}
        </div>
      )}

      <div
        className={cn(
          isInline
            ? "flex flex-wrap items-end gap-3"
            : "grid grid-cols-1 sm:grid-cols-2 gap-4"
        )}
      >
        <div className={cn("grid gap-2", isInline && "w-[190px]")}>
          <Label
            className={cn(
              isInline && "text-xs text-muted-foreground font-medium"
            )}
          >
            {startLabel}
          </Label>
          <DateField
            value={startDate}
            onChange={handleStartChange}
            minDate={minDate}
            maxDate={maxDate}
            disabled={disabled}
          />
        </div>

        <div className={cn("grid gap-2", isInline && "w-[190px]")}>
          <Label
            className={cn(
              isInline && "text-xs text-muted-foreground font-medium"
            )}
          >
            {endLabel}
          </Label>
          <DateField
            value={endDate}
            onChange={handleEndChange}
            minDate={startDate ?? minDate}
            maxDate={endMaxDate}
            disabled={disabled || !startDate}
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangeFilter;
