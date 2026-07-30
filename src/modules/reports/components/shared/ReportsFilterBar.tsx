import { RefreshCw, Check } from 'lucide-react';
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

export function ReportsFilterBar() {
  const { draft, setDraft, apply, isDirty } = useReportsFilters();
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
    <div className="flex flex-wrap items-end gap-3 p-4 bg-card rounded-lg border mb-6">
      {/* Date Range */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground font-medium">Desde</span>
        <input
          type="date"
          value={draft.startDate ?? ''}
          onChange={(e) => {
            const start = e.target.value || null;
            const updates: Partial<typeof draft> = { startDate: start };
            // Si el endDate actual supera el rango máximo, lo recorta
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

      {/* Aplicar */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground font-medium opacity-0">.</span>
        <Button size="sm" onClick={apply} disabled={!isDirty} className="gap-1.5">
          <Check className="h-4 w-4" />
          Aplicar
        </Button>
      </div>

      {/* Refresh button */}
      <div className="ml-auto flex items-end gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium opacity-0">.</span>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar datos
          </Button>
        </div>
      </div>
    </div>
  );
}
