import { Suspense, lazy, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Loader2 } from 'lucide-react';
import { toast } from '@/shared/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { priceRulesReportService, filterOptionsService } from '../services/reports.service';
import { defaultSituationIds, isSameIdSet } from '../types/reports.types';
import { TabSkeleton } from '../components/shared/TabSkeleton';
import { ReportsFilterBar } from '../components/shared/ReportsFilterBar';
import { OrderSituationFilter } from '../components/shared/OrderSituationFilter';
import { OrderScopeFilters } from '../components/shared/OrderScopeFilters';
import { generatePriceRulesReportExcel } from '../utils/generatePriceRulesReportExcel';
import { toastError } from '@/shared/utils/toastError';

const PriceRulesDashboard = lazy(() =>
  import('../components/price-rules/PriceRulesDashboard').then((m) => ({ default: m.PriceRulesDashboard })),
);

export default function PriceRulesReportPage() {
  const { filters, draft, setDraft, applyImmediate } = useReportsFilters();
  const [isExporting, setIsExporting] = useState(false);

  const situations = useQuery({
    queryKey: ['filter_order_situations'],
    queryFn: filterOptionsService.getOrderSituations,
    staleTime: 1000 * 60 * 60,
  });

  const situationIsDefault =
    draft.situationIds === null ||
    isSameIdSet(draft.situationIds, defaultSituationIds(situations.data ?? []));

  const extraActiveCount =
    [
      draft.branchId,
      draft.saleTypeId,
      draft.countryId,
      draft.stateId,
      draft.cityId,
      draft.neighborhoodId,
      draft.paymentMethodId,
      draft.priceListCode,
    ].filter((v) => v !== null && v !== undefined).length + (situationIsDefault ? 0 : 1);

  function handleClearExtra() {
    applyImmediate({
      ...draft,
      branchId: null,
      saleTypeId: null,
      countryId: null,
      stateId: null,
      cityId: null,
      neighborhoodId: null,
      paymentMethodId: null,
      priceListCode: null,
      situationIds: null,
    });
  }

  // Mismo patrón que Ventas, Productos, Clientes y Stock: botón directo con los
  // filtros ya aplicados, sin diálogo. Sale del mismo SP que pinta la pantalla,
  // así que el archivo no puede desalinearse de lo que se ve.
  async function handleDownload() {
    if (!filters.startDate || !filters.endDate) {
      toast({ title: 'Elegí un rango de fechas en los filtros antes de exportar', variant: 'warning' });
      return;
    }

    setIsExporting(true);
    try {
      const report = await priceRulesReportService.getReport(filters);
      if (report.table.length === 0) {
        toast({ title: 'No hay reglas para el rango seleccionado', variant: 'warning' });
        return;
      }
      generatePriceRulesReportExcel(report.table, report.other, filters.startDate, filters.endDate);
      toast({ title: `Reporte exportado: ${report.table.length} reglas`, variant: 'success' });
    } catch (error) {
      toastError(error, 'Error al generar el reporte. Inténtalo de nuevo.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Reportes de regla de precios</h1>
        <p className="text-muted-foreground text-sm">Panel de análisis y métricas del negocio</p>
      </div>
      <ReportsFilterBar
        // Hasta acá la pestaña solo tenía el rango de fechas. El estado de
        // pedido lleva el default de Ventas (todo menos cancelado y
        // reembolsado): sin él la pantalla contaba como uso de una regla los
        // descuentos de pedidos que después se cancelaron.
        extraFields={
          <>
            <OrderSituationFilter
              value={draft.situationIds}
              onChange={(ids) => setDraft({ situationIds: ids })}
              defaultIds={defaultSituationIds}
            />
            <OrderScopeFilters />
          </>
        }
        extraActiveCount={extraActiveCount}
        onClearExtra={handleClearExtra}
        exportSlot={
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isExporting}
            className="gap-1.5"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {isExporting ? 'Generando...' : 'Descargar'}
          </Button>
        }
        footNote={
          <>
            Una <strong className="font-medium text-foreground">aplicación</strong> es un descuento
            de regla dentro de un pedido, contado una sola vez y acreditado a la regla que estaba
            vigente ese día: el pedido solo guarda el código del descuento, y una regla dada de
            baja conserva el suyo cuando se la recrea, así que el código solo no alcanza para
            saber cuál fue. Entre las reglas vigentes ya no puede repetirse.{' '}
            <strong className="font-medium text-foreground">Venta generada</strong> es la venta de
            los pedidos donde aplicó, <em>no</em> el monto descontado: las reglas descuentan por
            unidad dentro de cada línea y el ERP no guarda ese monto atribuido a la regla. Un
            pedido con dos reglas suma su venta en las dos filas, mientras que la tarjeta{' '}
            <strong className="font-medium text-foreground">Venta con regla</strong> lo cuenta una
            sola vez.{' '}
            <strong className="font-medium text-foreground">Otros descuentos</strong> junta lo que
            no sale de una regla — el descuento manual del vendedor, el descuento por producto y el
            recargo de Mercado Pago — y por eso queda fuera del % de uso.{' '}
            <strong className="font-medium text-foreground">Reglas activas</strong> es el catálogo
            de hoy y no cambia con el rango; las otras tres tarjetas sí.
          </>
        }
      />
      <Suspense fallback={<TabSkeleton />}>
        <PriceRulesDashboard filters={filters} />
      </Suspense>
    </div>
  );
}
