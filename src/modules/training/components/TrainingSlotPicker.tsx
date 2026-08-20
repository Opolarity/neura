import { useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { TrainingSlotApi } from "../types/Training.types";
import {
  browserTimeZone,
  dayKey,
  formatTrainingDate,
  formatTrainingTime,
} from "../utils/formatTraining";

interface TrainingSlotPickerProps {
  slots: TrainingSlotApi[];
  loading: boolean;
  error: string | null;
  selected: string | null;
  onSelect: (start: string) => void;
  onReload: () => void;
}

/**
 * Los horarios se agrupan por día civil del usuario, no del capacitador: es el
 * día que él ve en su calendario. Un slot de las 22:00 en Lima puede ser del
 * día siguiente en Madrid, y agruparlo por el día del anfitrión lo dejaría en
 * la columna equivocada.
 */
export const TrainingSlotPicker = ({
  slots,
  loading,
  error,
  selected,
  onSelect,
  onReload,
}: TrainingSlotPickerProps) => {
  const timeZone = browserTimeZone();

  const days = useMemo(() => {
    const grouped = new Map<string, TrainingSlotApi[]>();
    for (const slot of slots) {
      const key = dayKey(slot.start, timeZone);
      const bucket = grouped.get(key);
      if (bucket) bucket.push(slot);
      else grouped.set(key, [slot]);
    }
    return [...grouped.entries()].map(([key, daySlots]) => ({ key, slots: daySlots }));
  }, [slots, timeZone]);

  const [openDay, setOpenDay] = useState<string | null>(null);
  // El primer día con cupo va abierto: obligar a un click extra para ver el
  // horario más cercano no aporta nada.
  const activeDay = openDay ?? days[0]?.key ?? null;

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button type="button" variant="outline" size="sm" onClick={onReload}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  if (!days.length) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No hay horarios disponibles en las próximas semanas.
      </p>
    );
  }

  const current = days.find((day) => day.key === activeDay) ?? days[0];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {days.map((day) => (
          <Button
            key={day.key}
            type="button"
            size="sm"
            variant={day.key === current.key ? "default" : "outline"}
            onClick={() => setOpenDay(day.key)}
          >
            {formatTrainingDate(day.slots[0].start, timeZone)}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {current.slots.map((slot) => (
          <Button
            key={slot.start}
            type="button"
            size="sm"
            variant={slot.start === selected ? "default" : "outline"}
            onClick={() => onSelect(slot.start)}
          >
            {formatTrainingTime(slot.start, timeZone)}
          </Button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Horarios en tu zona ({timeZone}).
      </p>
    </div>
  );
};

/** Spinner en línea para los botones del diálogo. */
export const InlineSpinner = () => <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
