import { RefreshCw, Check, Filter, ChevronDown, ChevronUp, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { refreshReportMviews } from '../../services/reports.service';
import { useReportsFilters } from '../../context/ReportsFiltersContext';
import { useState } from 'react';
import { toast } from 'sonner';
import { LIMA_TIME_ZONE } from '@/shared/utils/date';

const MAX_RANGE_DAYS = 90;

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr.replace(/-/g, "/"));
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("sv-SE", { timeZone: LIMA_TIME_ZONE });
}

function diffDays(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

interface ReportsFilterBarProps {
  /** Grid de campos de "Más filtros" (sin caja propia). Si se omite, no se muestra el toggle. */
  extraFields?: ReactNode;
  /** Cuántos filtros extra están activos — badge + decide si se muestra "Limpiar". */
  extraActiveCount?: number;
  /** Limpia los filtros compartidos (sede/canal/pago/geo) + los propios del tab. */
  onClearExtra?: () => void;
  /** Botón "Descargar" del tab (si tiene exportación). */
  exportSlot?: ReactNode;
}

export function ReportsFilterBar({ extraFields, extraActiveCount = 0, onClearExtra, exportSlot }: ReportsFilterBarProps) {
  const { draft, setDraft, apply, isDirty } = useReportsFilters();
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refreshReportMviews();
      toast.success('Datos actualizados correctamente');
    } catch {
      toast.error('Error al actualizar los datos');
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3 mb-6">
      <div className="flex flex-wrap items-end gap-3">
        {/* Date Range */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium">Desde</span>
          <input
            type="date"
            value={draft.startDate ?? ''}
            onChange={(e) => {
              const start = e.target.value || null;
              const updates: Partial<typeof draft> = { startDate: start };
              if (start && draft.endDate && diffDays(start, draft.endDate) > MAX_RANGE_DAYS) {
                updates.endDate = addDays(start, MAX_RANGE_DAYS);
              }
              setDraft(updates);
            }}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium">Hasta</span>
          <input
            type="date"
            value={draft.endDate ?? ''}
            min={draft.startDate ?? undefined}
            max={draft.startDate ? addDays(draft.startDate, MAX_RANGE_DAYS) : undefined}
            onChange={(e) => setDraft({ endDate: e.target.value || null })}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

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
          <Button size="sm" onClick={apply} disabled={!isDirty} className="gap-1.5">
            <Check className="h-4 w-4" />
            Aplicar
          </Button>
        </div>
      </div>
    </div>
  );
}
