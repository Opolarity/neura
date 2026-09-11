import { Suspense, lazy, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Loader2 } from 'lucide-react';
import { toast } from '@/shared/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { TabSkeleton } from '../components/shared/TabSkeleton';
import { ReportsFilterBar } from '../components/shared/ReportsFilterBar';
import { SalesGeoFilters } from '../components/sales/SalesGeoFilters';
import { fetchSellersOrdersReport, filterOptionsService, sellersService } from '../services/reports.service';
import { defaultSituationIds, isSameIdSet } from '../types/reports.types';
import { generateSellersReportExcel } from '../utils/generateSellersReportExcel';
import { toastError } from '@/shared/utils/toastError';

const SellersDashboard = lazy(() =>
  import('../components/sellers/SellersDashboard').then((m) => ({ default: m.SellersDashboard })),
);

/**
 * Reporte "Ventas por usuarios (vendedores)". Misma barra y mismos filtros
 * que Ventas: los campos de "Más filtros" son los de SalesGeoFilters (estado
 * de pedido con el default de Ventas, sede, canal, pago, lista, geografía).
 */
export default function SellersPage() {
  const { filters, draft, applyImmediate } = useReportsFilters();
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
      draft.countryId,
      draft.stateId,
      draft.cityId,
      draft.neighborhoodId,
      draft.saleTypeId,
      draft.paymentMethodId,
      draft.priceListCode,
    ].filter((v) => v !== null && v !== undefined).length + (situationIsDefault ? 0 : 1);

  function handleClearExtra() {
    applyImmediate({
      ...draft,
      branchId: null,
      countryId: null,
      stateId: null,
      cityId: null,
      neighborhoodId: null,
      saleTypeId: null,
      paymentMethodId: null,
      situationIds: null,
      priceListCode: null,
    });
  }

  // Las dos hojas salen con los filtros aplicados: el resumen es la misma
  // tabla de la pantalla y los pedidos permiten auditar quién registró cada uno.
  async function handleDownload() {
    if (!filters.startDate || !filters.endDate) {
      toast({ title: 'Elegí un rango de fechas en los filtros antes de exportar', variant: 'warning' });
      return;
    }
    setIsExporting(true);
    try {
      const [summary, orders] = await Promise.all([
        sellersService.getSummary(filters),
        fetchSellersOrdersReport(filters),
      ]);
      if (orders.length === 0) {
        toast({ title: 'No hay ventas para los filtros seleccionados', variant: 'warning' });
        return;
      }
      generateSellersReportExcel(summary, orders, filters.startDate, filters.endDate);
      toast({ title: `Reporte exportado: ${orders.length} pedidos`, variant: 'success' });
    } catch (error) {
      toastError(error, 'Error al generar el reporte. Inténtalo de nuevo.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Reporte de ventas por usuarios</h1>
        <p className="text-muted-foreground text-sm">Quién registró cada venta: vendedores por sucursal, ranking y evolución</p>
      </div>
      <ReportsFilterBar
        extraFields={<SalesGeoFilters />}
        extraActiveCount={extraActiveCount}
        onClearExtra={handleClearExtra}
        footNote={
          <>
            <strong className="font-medium text-foreground">Vendedor</strong> es el usuario que
            registró el pedido desde el ERP o el POS. Las ventas de la web y el chatbot no tienen
            vendedor: se cuentan aparte como{' '}
            <strong className="font-medium text-foreground">Sin vendedor</strong> y no entran al
            ranking. <strong className="font-medium text-foreground">Ventas</strong> es el valor
            del pedido, no lo cobrado, y por defecto excluye cancelados y reembolsados. La sucursal
            del ranking y la tabla es la del perfil del usuario; la del gráfico por sucursal es la
            del pedido.
          </>
        }
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
      />
      <Suspense fallback={<TabSkeleton />}>
        <SellersDashboard filters={filters} />
      </Suspense>
    </div>
  );
}
