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
import { diffCalendarDays, formatDateDisplay } from '@/shared/utils/date';

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

  /**
   * Sin esto el Excel podía salir vacío en silencio: si el catálogo de
   * situaciones no había cargado (o su query falló), `defaultProductSituationIds`
   * devuelve [] y el SP con `p_situation_ids` en array vacío no matchea ninguna
   * orden — 0 filas, sin error. El hook del dashboard ya se protegía igual.
   */
  const situationsReady = filters.productSituationIds !== null || situations.isSuccess;

  const [isLoading, setIsLoading] = useState(false);

  // El rango es el de la barra de filtros, no uno propio del modal: el archivo
  // tiene que cubrir el mismo periodo que la pantalla. Antes el modal pedía sus
  // fechas aparte, con un tope de 31 días contra los 90 que permite la barra.
  const startDate = filters.startDate;
  const endDate = filters.endDate;
  const dayCount =
    startDate && endDate ? diffCalendarDays(startDate, endDate) + 1 : null;

  const canDownload = startDate !== null && endDate !== null && situationsReady && !isLoading;

  async function handleDownload() {
    if (!startDate || !endDate || !situationsReady) return;

    setIsLoading(true);
    try {
      // Mismo criterio que los gráficos, para que el Excel no contradiga a la
      // pantalla. Hasta la migración 31000908124100 estos SP solo aceptaban
      // fecha y situación, así que el archivo salía sin filtrar por sede ni
      // canal — con sede = Gamarra la pantalla mostraba 637.00 y el Excel
      // exportaba 5816.25.
      const scope = {
        p_start_date: startDate,
        p_end_date: endDate,
        p_branch_id: filters.branchId ?? undefined,
        p_sale_type_id: filters.saleTypeId ?? undefined,
        p_country_id: filters.countryId ?? undefined,
        p_state_id: filters.stateId ?? undefined,
        p_city_id: filters.cityId ?? undefined,
        p_neighborhood_id: filters.neighborhoodId ?? undefined,
        p_payment_method_id: filters.paymentMethodId ?? undefined,
        p_price_list_code: filters.priceListCode ?? undefined,
        p_situation_ids: situationIds,
      };

      const [resProducts, resCategories] = await Promise.all([
        supabase.rpc('sp_rpt_export_products_by_product', scope),
        supabase.rpc('sp_rpt_export_products_by_category', scope),
      ]);

      if (resProducts.error) throw resProducts.error;
      if (resCategories.error) throw resCategories.error;

      const byProduct: ProductExportRow[] = resProducts.data ?? [];
      const byCategory: CategoryExportRow[] = resCategories.data ?? [];

      if (byProduct.length === 0 && byCategory.length === 0) {
        toast({ title: 'No hay datos para el rango seleccionado', variant: "warning" });
        return;
      }

      generateProductsReportExcel(byProduct, byCategory, startDate, endDate);
      toast({ title: `Reporte exportado: ${byProduct.length} productos`, variant: "success" });
      onOpenChange(false);
    } catch (error) {
      toastError(error, 'Error al generar el reporte. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenChange(value: boolean) {
    if (!isLoading) onOpenChange(value);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Descargar Reporte de Productos</DialogTitle>
          <DialogDescription>
            Se exportan las ventas por producto y por categoría del mismo periodo y con los
            mismos filtros que muestra la pantalla.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 py-4 text-sm">
          {startDate && endDate ? (
            <p className="text-muted-foreground">
              Periodo:{' '}
              <span className="font-medium text-foreground">
                {formatDateDisplay(startDate)} — {formatDateDisplay(endDate)}
              </span>
              {dayCount !== null && ` (${dayCount} día${dayCount !== 1 ? 's' : ''})`}
            </p>
          ) : (
            <p className="text-destructive">
              Elegí un rango de fechas en los filtros antes de exportar.
            </p>
          )}

          {!situationsReady && (
            <p className="text-destructive">
              {situations.isError
                ? 'No se pudo cargar el catálogo de estados de pedido. Recargá la página e intentá de nuevo.'
                : 'Cargando estados de pedido…'}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleDownload} disabled={!canDownload}>
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
