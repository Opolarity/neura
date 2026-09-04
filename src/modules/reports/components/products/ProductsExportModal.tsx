import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Loader2 } from 'lucide-react';
import { toast } from "@/shared/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DateRangeFilter, DateRangeValue } from '@/shared/components/date-range';
import { diffCalendarDays } from '@/shared/utils/date';

import {
  generateProductsReportExcel,
  type ProductExportRow,
  type CategoryExportRow,
} from '../../utils/generateProductsReportExcel';
import { useReportsFilters } from '../../context/ReportsFiltersContext';
import { filterOptionsService } from '../../services/reports.service';
import { defaultProductSituationIds } from '../../types/reports.types';
import { toastError } from "@/shared/utils/toastError";

interface ProductsExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_DAYS = 31;

export function ProductsExportModal({ open, onOpenChange }: ProductsExportModalProps) {
  const { filters } = useReportsFilters();

  const situations = useQuery({
    queryKey: ['filter_order_situations'],
    queryFn: filterOptionsService.getOrderSituations,
    staleTime: 1000 * 60 * 60,
  });

  const situationIds = useMemo(
    () => filters.productSituationIds ?? defaultProductSituationIds(situations.data ?? []),
    [filters.productSituationIds, situations.data],
  );

  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDateChange = ({ startDate, endDate }: DateRangeValue) => {
    setStartDate(startDate);
    setEndDate(endDate);
  };

  const daysDiff = startDate && endDate ? diffCalendarDays(startDate, endDate) : null;

  const isValid =
    startDate !== null &&
    endDate !== null &&
    daysDiff !== null &&
    daysDiff >= 0 &&
    daysDiff <= MAX_DAYS;

  const validationError =
    startDate && endDate && daysDiff !== null
      ? daysDiff < 0
        ? 'La fecha fin debe ser posterior a la fecha inicio'
        : daysDiff > MAX_DAYS
        ? `El rango máximo permitido es de ${MAX_DAYS} días`
        : null
      : null;

  async function handleDownload() {
    if (!isValid || !startDate || !endDate) return;

    setIsLoading(true);
    try {
      const start = startDate;
      const end = endDate;

      // El rango es propio del modal, pero el criterio de venta no: el Excel
      // tiene que cuadrar con lo que se ve en los gráficos.
      const [resProducts, resCategories] = await Promise.all([
        supabase.rpc('sp_rpt_export_products_by_product', {
          p_start_date: start,
          p_end_date: end,
          p_situation_ids: situationIds,
        }),
        supabase.rpc('sp_rpt_export_products_by_category', {
          p_start_date: start,
          p_end_date: end,
          p_situation_ids: situationIds,
        }),
      ]);

      if (resProducts.error) throw resProducts.error;
      if (resCategories.error) throw resCategories.error;

      const byProduct: ProductExportRow[] = resProducts.data ?? [];
      const byCategory: CategoryExportRow[] = resCategories.data ?? [];

      if (byProduct.length === 0 && byCategory.length === 0) {
        toast({ title: 'No hay datos para el rango seleccionado', variant: "warning" });
        return;
      }

      generateProductsReportExcel(byProduct, byCategory, start, end);
      toast({ title: `Reporte exportado: ${byProduct.length} productos`, variant: "success" });
      onOpenChange(false);
    } catch (error) {
      toastError(error, 'Error al generar el reporte. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenChange(value: boolean) {
    if (!isLoading) {
      if (!value) {
        setStartDate(null);
        setEndDate(null);
      }
      onOpenChange(value);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Descargar Reporte de Productos</DialogTitle>
          <DialogDescription>
            Selecciona un rango de fechas (máximo {MAX_DAYS} días) para exportar las
            ventas por producto y categoría a Excel.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateChange}
            startLabel="Fecha inicio"
            endLabel="Fecha fin"
            maxRangeDays={MAX_DAYS}
            disabled={isLoading}
          />

          {validationError && (
            <p className="text-sm text-destructive">{validationError}</p>
          )}

          {isValid && daysDiff !== null && (
            <p className="text-sm text-muted-foreground">
              Rango seleccionado:{' '}
              <span className="font-medium text-foreground">
                {daysDiff + 1} día{daysDiff + 1 !== 1 ? 's' : ''}
              </span>
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleDownload} disabled={!isValid || isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isLoading ? 'Generando...' : 'Descargar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
