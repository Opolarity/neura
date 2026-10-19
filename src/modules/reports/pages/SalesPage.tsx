import { Suspense, lazy, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Loader2 } from 'lucide-react';
import { toast } from "@/shared/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { TabSkeleton } from '../components/shared/TabSkeleton';
import { ReportsFilterBar } from '../components/shared/ReportsFilterBar';
import { SalesGeoFilters } from '../components/sales/SalesGeoFilters';
import { fetchSalesReport, fetchSalesDetailReport, filterOptionsService } from '../services/reports.service';
import { defaultSituationIds, isSameIdSet } from '../types/reports.types';
import { generateSalesReportExcel } from '../utils/generateSalesReportExcel';
import { ReportGuideSheet } from '../components/shared/ReportGuideSheet';
import { salesGuide } from '../guides/reportGuides';

const SalesDashboard = lazy(() =>
  import('../components/sales/SalesDashboard').then((m) => ({ default: m.SalesDashboard })),
);
import { toastError } from "@/shared/utils/toastError";

export default function SalesPage() {
  const { filters, draft, applyImmediate } = useReportsFilters();
  const [isExporting, setIsExporting] = useState(false);

  // El catálogo ya está cacheado por el filtro de situación; se lee aquí solo
  // para saber si la selección difiere del default y encender el badge.
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
      draft.branchIds,
      draft.countryId,
      draft.stateId,
      draft.cityId,
      draft.neighborhoodId,
      draft.saleTypeIds,
      draft.paymentMethodIds,
      draft.priceListCodes,
    ].filter((v) => v !== null && v !== undefined).length + (situationIsDefault ? 0 : 1);

  function handleClearExtra() {
    applyImmediate({
      ...draft,
      branchIds: null,
      countryId: null,
      stateId: null,
      cityId: null,
      neighborhoodId: null,
      saleTypeIds: null,
      paymentMethodIds: null,
      situationIds: null,
      priceListCodes: null,
    });
  }

  // El Excel se genera con los filtros ya aplicados en la barra: no se
  // vuelve a pedir el rango de fechas. Las dos hojas se piden en paralelo
  // porque son independientes y comparten los mismos filtros.
  async function handleDownload() {
    setIsExporting(true);
    try {
      const [rows, detailRows] = await Promise.all([
        fetchSalesReport(filters),
        fetchSalesDetailReport(filters),
      ]);
      generateSalesReportExcel(
        rows,
        detailRows,
        filters.startDate ?? '',
        filters.endDate ?? '',
      );
      toast({ title: `${rows.length} ventas y ${detailRows.length} ítems exportados`, variant: "success" });
    } catch (error) {
      toastError(error, 'Error al generar el reporte. Inténtalo de nuevo.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Reportes de ventas</h1>
        <ReportGuideSheet guide={salesGuide} />
      </div>
      <ReportsFilterBar
        extraFields={<SalesGeoFilters />}
        extraActiveCount={extraActiveCount}
        onClearExtra={handleClearExtra}
        footNote={
          <>
            <strong className="font-medium text-foreground">Ventas Totales</strong> suma los pagos
            registrados de cada pedido, neto de devoluciones: un pedido sin cobrar o cobrado en
            parte aporta solo lo efectivamente pagado.{' '}
            <strong className="font-medium text-foreground">N° de Pedidos</strong> cuenta los
            pedidos por su estado, estén pagados o no — por eso las dos cifras no siempre se
            acompañan.
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
        <SalesDashboard filters={filters} />
      </Suspense>
    </div>
  );
}
