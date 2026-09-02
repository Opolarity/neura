import { RefreshCw, Check, Filter, ChevronDown, ChevronUp, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { refreshReportMviews } from '../../services/reports.service';
import { useReportsFilters } from '../../context/ReportsFiltersContext';
import { useState } from 'react';
import { toast } from "@/shared/hooks/use-toast";
import { DateRangeFilter } from '@/shared/components/date-range';
import { toastError } from "@/shared/utils/toastError";

const MAX_RANGE_DAYS = 90;

interface ReportsFilterBarProps {
  /** Grid de campos de "Más filtros" (sin caja propia). Si se omite, no se muestra el toggle. */
  extraFields?: ReactNode;
  /** Cuántos filtros extra están activos — badge + decide si se muestra "Limpiar". */
  extraActiveCount?: number;
  /** Limpia los filtros compartidos (sede/canal/pago/geo) + los propios del tab. */
  onClearExtra?: () => void;
  /** Botón "Descargar" del tab (si tiene exportación). */
  exportSlot?: ReactNode;
  /** true si hay cambios sin aplicar en los filtros propios del tab (ej. producto de Productos). */
  extraDirty?: boolean;
}

export function ReportsFilterBar({ extraFields, extraActiveCount = 0, onClearExtra, exportSlot, extraDirty = false }: ReportsFilterBarProps) {
  const { draft, setDraft, apply, isDirty } = useReportsFilters();
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refreshReportMviews();
      toast({ title: 'Datos actualizados correctamente', variant: "success" });
    } catch (error) {
      toastError(error, 'Error al actualizar los datos');
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3 mb-6">
      <div className="flex flex-wrap items-end gap-3">
        {/* Date Range */}
        <DateRangeFilter
          startDate={draft.startDate ?? null}
          endDate={draft.endDate ?? null}
          onChange={setDraft}
          startLabel="Desde"
          endLabel="Hasta"
          layout="inline"
          maxRangeDays={MAX_RANGE_DAYS}
        />

        {/* Más filtros */}
        {extraFields && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen((p) => !p)}
            className="h-9 gap-1.5"
          >
            <Filter className="w-3.5 h-3.5" />
            Más filtros
            {extraActiveCount > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {extraActiveCount}
              </span>
            )}
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
        )}
      </div>

      {/* Campos extra (expandido) */}
      {open && extraFields && (
        <div className="flex flex-wrap items-end gap-3 pt-3 border-t">
          {extraFields}
        </div>
      )}

      {/* Fila de acciones — siempre visible */}
      <div className="flex items-center gap-2 pt-3 border-t">
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar datos
        </Button>

        <div className="ml-auto flex items-center gap-2">
          {extraActiveCount > 0 && onClearExtra && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearExtra}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
              Limpiar
            </Button>
          )}
          {exportSlot}
          <Button size="sm" onClick={apply} disabled={!isDirty && !extraDirty} className="gap-1.5">
            <Check className="h-4 w-4" />
            Aplicar
          </Button>
        </div>
      </div>
    </div>
  );
}
