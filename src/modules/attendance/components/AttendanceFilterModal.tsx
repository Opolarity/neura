import { ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DateRangeFilter } from "@/shared/components/date-range";

export interface FilterRange {
  dateFrom: string | null;
  dateTo: string | null;
}

interface AttendanceFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Rango aplicado: al abrir, el borrador parte de aquí. */
  range: FilterRange;
  /** «Limpiar» deja este rango (null/null = sin fechas). */
  defaultRange: FilterRange;
  /** Las fechas van las dos o ninguna; false = son obligatorias. */
  allowEmpty?: boolean;
  maxRangeDays?: number;
  /** Atajos propios (en vez de los de DateRangeFilter). */
  presets?: { label: string; range: FilterRange }[];
  onApply: (range: FilterRange) => void;
  /** Filtros propios que van antes de «Fechas» (p. ej. «Pago» en Pagos y cobros, como en Destajo). */
  top?: ReactNode;
  /** Filtros propios de la pantalla (su borrador lo maneja la pantalla). */
  children?: ReactNode;
  /** «Limpiar» de los filtros propios. */
  onClearExtra?: () => void;
  /** Filtros activos para el contador del botón. */
  activeCount?: number;
}

/**
 * El popup «Filtrar» de las tablas de asistencia, como el de Ventas: fechas
 * (DateRangeFilter) y los filtros propios, con «Limpiar» y «Aplicar filtros».
 * Se edita un borrador; nada cambia hasta aplicar.
 */
export const AttendanceFilterModal = ({
  open,
  onOpenChange,
  title,
  range,
  defaultRange,
  allowEmpty = false,
  maxRangeDays,
  presets,
  onApply,
  top,
  children,
  onClearExtra,
  activeCount = 0,
}: AttendanceFilterModalProps) => {
  const [draft, setDraft] = useState<FilterRange>(range);

  useEffect(() => {
    if (open) setDraft(range);
    // Solo al abrir: después manda el borrador.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const incompletas = (draft.dateFrom === null) !== (draft.dateTo === null);
  const vacias = draft.dateFrom === null && draft.dateTo === null;
  const invalido = incompletas || (!allowEmpty && vacias);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader className="border-b pb-4">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[50vh]">
          <ScrollArea className="h-full">
            <div className="space-y-4 py-4 pl-1 pr-4">
              {top}
              <div className="space-y-2">
                <Label>Fechas</Label>
                <DateRangeFilter
                  startLabel="Desde"
                  endLabel="Hasta"
                  startDate={draft.dateFrom}
                  endDate={draft.dateTo}
                  maxRangeDays={maxRangeDays}
                  showPresets={!presets}
                  onChange={({ startDate, endDate }) => setDraft({ dateFrom: startDate, dateTo: endDate })}
                />
                {presets && (
                  <div className="flex flex-wrap gap-2">
                    {presets.map((p) => (
                      <Button key={p.label} type="button" variant="outline" size="sm" onClick={() => setDraft(p.range)}>
                        {p.label}
                      </Button>
                    ))}
                  </div>
                )}
                {incompletas && <p className="text-xs text-muted-foreground">Indica las dos fechas.</p>}
                {!allowEmpty && vacias && <p className="text-xs text-muted-foreground">Elige un rango de fechas.</p>}
              </div>
              {children}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button
            variant="outline"
            onClick={() => {
              setDraft(defaultRange);
              onClearExtra?.();
            }}
          >
            Limpiar
          </Button>
          <Button
            disabled={invalido}
            onClick={() => {
              onApply(draft);
              onOpenChange(false);
            }}
          >
            Aplicar filtros{activeCount > 0 ? ` (${activeCount})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
