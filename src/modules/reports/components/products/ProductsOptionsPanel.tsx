import { useState } from 'react';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  generateProductsReportExcel,
  type ProductExportRow,
  type CategoryExportRow,
} from '../../utils/generateProductsReportExcel';

const MAX_RANGE_DAYS = 31;

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function diffDays(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonthISO(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export function ProductsOptionsPanel() {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState(firstOfMonthISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [loading, setLoading] = useState(false);

  function handleStartChange(value: string) {
    setStartDate(value);
    if (value && endDate && diffDays(value, endDate) > MAX_RANGE_DAYS) {
      setEndDate(addDays(value, MAX_RANGE_DAYS));
    }
  }

  async function handleDownload() {
    if (!startDate || !endDate) {
      toast.error('Selecciona un rango de fechas');
      return;
    }
    if (diffDays(startDate, endDate) > MAX_RANGE_DAYS) {
      toast.error(`El rango máximo es ${MAX_RANGE_DAYS} días`);
      return;
    }

    setLoading(true);
    try {
      const [resProducts, resCategories] = await Promise.all([
        supabase.rpc('sp_rpt_export_products_by_product', {
          p_start_date: startDate,
          p_end_date: endDate,
        }),
        supabase.rpc('sp_rpt_export_products_by_category', {
          p_start_date: startDate,
          p_end_date: endDate,
        }),
      ]);

      if (resProducts.error) throw resProducts.error;
      if (resCategories.error) throw resCategories.error;

      const byProduct: ProductExportRow[] = resProducts.data ?? [];
      const byCategory: CategoryExportRow[] = resCategories.data ?? [];

      if (byProduct.length === 0 && byCategory.length === 0) {
        toast.warning('No hay datos para el rango seleccionado');
        return;
      }

      generateProductsReportExcel(byProduct, byCategory, startDate, endDate);
      toast.success('Reporte descargado correctamente');
    } catch (err) {
      console.error(err);
      toast.error('Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          Más opciones
          <span className="text-primary font-semibold">+</span>
        </span>
        {open
          ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="flex flex-wrap items-end gap-3 px-4 pb-4 border-t pt-3">
          {/* Desde */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">Desde</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartChange(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Hasta */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">
              Hasta <span className="text-muted-foreground/60">(máx. {MAX_RANGE_DAYS} días)</span>
            </span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={startDate ? addDays(startDate, MAX_RANGE_DAYS) : undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Descargar */}
          <div className="ml-auto flex items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={loading}
              className="h-9 gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              {loading ? 'Generando...' : 'Descargar'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
