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
import { defaultSituationIds } from '../types/reports.types';
import { generateSalesReportExcel } from '../utils/generateSalesReportExcel';

/** Compara dos listas de ids sin importar el orden. */
function isSameIdSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}

const SalesDashboard = lazy(() =>
  import('../components/sales/SalesDashboard').then((m) => ({ default: m.SalesDashboard })),
);

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
    } catch {
      toast({ title: 'Error al generar el reporte. Inténtalo de nuevo.', variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <ReportsFilterBar
        extraFields={<SalesGeoFilters />}
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
      />
      <Suspense fallback={<TabSkeleton />}>
        <SalesDashboard filters={filters} />
      </Suspense>
    </div>
  );
}
