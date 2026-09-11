import { Suspense, lazy, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Loader2 } from 'lucide-react';
import { toast } from '@/shared/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { TabSkeleton } from '../components/shared/TabSkeleton';
import { ReportsFilterBar } from '../components/shared/ReportsFilterBar';
import { ReturnsOptionsPanel } from '../components/returns/ReturnsOptionsPanel';
import { fetchReturnsReport, filterOptionsService } from '../services/reports.service';
import { defaultReturnSituationIds, isSameIdSet } from '../types/reports.types';
import { generateReturnsReportExcel } from '../utils/generateReturnsReportExcel';
import { toastError } from '@/shared/utils/toastError';
import { ReportGuideSheet } from '../components/shared/ReportGuideSheet';
import { returnsGuide } from '../guides/reportGuides';

const ReturnsDashboard = lazy(() =>
  import('../components/returns/ReturnsDashboard').then((m) => ({ default: m.ReturnsDashboard })),
);

export default function ReturnsPage() {
  const { filters, draft, applyImmediate } = useReportsFilters();
  const [isExporting, setIsExporting] = useState(false);

  // Mismas claves que usa ReturnsOptionsPanel, así que react-query no repite la
  // consulta: acá solo hacen falta para saber si la selección es la de fábrica.
  const situations = useQuery({
    queryKey: ['filter_return_situations'],
    queryFn: filterOptionsService.getReturnSituations,
    staleTime: 1000 * 60 * 60,
  });

  const types = useQuery({
    queryKey: ['filter_return_types'],
    queryFn: filterOptionsService.getReturnTypes,
    staleTime: 1000 * 60 * 60,
  });

  // Volver a marcar exactamente el default no cuenta como filtro activo.
  const situationIsDefault =
    draft.returnSituationIds === null ||
    isSameIdSet(draft.returnSituationIds, defaultReturnSituationIds(situations.data ?? []));

  const typeIsDefault =
    draft.returnTypeIds === null ||
    isSameIdSet(draft.returnTypeIds, (types.data ?? []).map((t) => t.id));

  const extraActiveCount =
    [
      draft.branchId,
      draft.saleTypeId,
      draft.paymentMethodId,
      draft.priceListCode,
      draft.countryId,
      draft.stateId,
      draft.cityId,
      draft.neighborhoodId,
    ].filter((v) => v !== null && v !== undefined).length +
    (situationIsDefault ? 0 : 1) +
    (typeIsDefault ? 0 : 1);

  function handleClearExtra() {
    applyImmediate({
      ...draft,
      returnSituationIds: null,
      returnTypeIds: null,
      branchId: null,
      saleTypeId: null,
      paymentMethodId: null,
      priceListCode: null,
      countryId: null,
      stateId: null,
      cityId: null,
      neighborhoodId: null,
    });
  }

  // El Excel se genera con los filtros ya aplicados en la barra, sin diálogo,
  // igual que las descargas de Ventas, Productos, Clientes e Inventario. Una
  // fila por retorno: la cantidad de filas es "Total devoluciones", la suma de
  // "Reembolsado" es el KPI de monto y la de "Unidades devueltas" el de
  // unidades.
  async function handleDownload() {
    if (!filters.startDate || !filters.endDate) {
      toast({ title: 'Elegí un rango de fechas en los filtros antes de exportar', variant: 'warning' });
      return;
    }

    setIsExporting(true);
    try {
      const rows = await fetchReturnsReport(filters);
      if (rows.length === 0) {
        toast({ title: 'No hay retornos para los filtros seleccionados', variant: 'warning' });
        return;
      }
      generateReturnsReportExcel(rows, filters.startDate, filters.endDate);
      toast({ title: `Reporte exportado: ${rows.length} retornos`, variant: 'success' });
    } catch (error) {
      toastError(error, 'Error al generar el reporte. Inténtalo de nuevo.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reportes de cambios/retornos</h1>
          <p className="text-muted-foreground text-sm">Panel de análisis y métricas del negocio</p>
        </div>
        <ReportGuideSheet guide={returnsGuide} />
      </div>
      <ReportsFilterBar
        extraFields={<ReturnsOptionsPanel />}
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
            Por defecto cuenta solo los retornos{' '}
            <strong className="font-medium text-foreground">Aceptados</strong> (Pendientes y
            Anulados se agregan desde el filtro), fechados por el día del retorno, no del pedido.{' '}
            <strong className="font-medium text-foreground">Monto reembolsado</strong> es el neto de
            caja del retorno: los reembolsos suman y la diferencia que paga el cliente en un cambio
            resta; los retornos sin movimiento cuentan en cantidad pero no en monto. Por eso no
            coincide con Devoluciones de la pestaña Ventas.{' '}
            <strong className="font-medium text-foreground">Tasa de devolución</strong> compara
            contra los pedidos del período sin cancelados. Los productos inactivos siguen contando;
            solo se marcan en el nombre.
          </>
        }
      />
      <Suspense fallback={<TabSkeleton />}>
        <ReturnsDashboard filters={filters} />
      </Suspense>
    </div>
  );
}
