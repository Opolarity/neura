import { useQuery } from '@tanstack/react-query';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { filterOptionsService, refreshReportMviews } from '../../services/reports.service';
import type { ReportsFilters } from '../../types/reports.types';
import { useState } from 'react';
import { toast } from 'sonner';
import { SalesExportModal } from './SalesExportModal';

interface ReportsFilterBarProps {
  filters: ReportsFilters;
  onChange: (filters: Partial<ReportsFilters>) => void;
}

const ALL_VALUE = '__all__';
const MAX_RANGE_DAYS = 90;

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function diffDays(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

export function ReportsFilterBar({ filters, onChange }: ReportsFilterBarProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const branches = useQuery({
    queryKey: ['filter_branches'],
    queryFn: filterOptionsService.getBranches,
    staleTime: 1000 * 60 * 10,
  });

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
          value={filters.startDate ?? ''}
          onChange={(e) => {
            const start = e.target.value || null;
            const updates: Partial<typeof filters> = { startDate: start };
            // Si el endDate actual supera el rango máximo, lo recorta
            if (start && filters.endDate && diffDays(start, filters.endDate) > MAX_RANGE_DAYS) {
              updates.endDate = addDays(start, MAX_RANGE_DAYS);
            }
            onChange(updates);
          }}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground font-medium">Hasta</span>
        <input
          type="date"
          value={filters.endDate ?? ''}
          min={filters.startDate ?? undefined}
          max={filters.startDate ? addDays(filters.startDate, MAX_RANGE_DAYS) : undefined}
          onChange={(e) => onChange({ endDate: e.target.value || null })}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {/* Branch */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground font-medium">Sucursal</span>
        <Select
          value={filters.branchId?.toString() ?? ALL_VALUE}
          onValueChange={(v) => onChange({ branchId: v === ALL_VALUE ? null : Number(v) })}
        >
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todas</SelectItem>
            {branches.data?.map((b) => (
              <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Refresh + Export buttons */}
      <div className="ml-auto flex items-end gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium opacity-0">.</span>
          <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Descargar
          </Button>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium opacity-0">.</span>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar datos
          </Button>
        </div>
      </div>

      <SalesExportModal open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
}
