import { useState } from 'react';
import { differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
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
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/shared/utils/utils';

import {
  generateProductsReportExcel,
  type ProductExportRow,
  type CategoryExportRow,
} from '../../utils/generateProductsReportExcel';

interface ProductsExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_DAYS = 31;

export function ProductsExportModal({ open, onOpenChange }: ProductsExportModalProps) {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const daysDiff = startDate && endDate ? differenceInDays(endDate, startDate) : null;

  const isValid =
    startDate !== undefined &&
    endDate !== undefined &&
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
      const start = format(startDate, 'yyyy-MM-dd');
      const end = format(endDate, 'yyyy-MM-dd');

      const [resProducts, resCategories] = await Promise.all([
        supabase.rpc('sp_rpt_export_products_by_product', {
          p_start_date: start,
          p_end_date: end,
        }),
        supabase.rpc('sp_rpt_export_products_by_category', {
          p_start_date: start,
          p_end_date: end,
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

      generateProductsReportExcel(byProduct, byCategory, start, end);
      toast.success(`Reporte exportado: ${byProduct.length} productos`);
      onOpenChange(false);
    } catch {
      toast.error('Error al generar el reporte. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenChange(value: boolean) {
    if (!isLoading) {
      if (!value) {
        setStartDate(undefined);
        setEndDate(undefined);
      }
      onOpenChange(value);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Descargar Reporte de Productos</DialogTitle>
          <DialogDescription>
            Selecciona un rango de fechas (máximo {MAX_DAYS} días) para exportar las
            ventas por producto y categoría a Excel.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Fecha inicio */}
          <div className="grid gap-2">
            <Label>Fecha inicio</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('justify-start text-left font-normal', !startDate && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar fecha'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Fecha fin */}
          <div className="grid gap-2">
            <Label>Fecha fin</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('justify-start text-left font-normal', !endDate && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar fecha'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) =>
                    date > new Date() ||
                    (startDate !== undefined && date < startDate) ||
                    (startDate !== undefined && differenceInDays(date, startDate) > MAX_DAYS)
                  }
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

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
