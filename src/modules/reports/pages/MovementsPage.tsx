import { Suspense, lazy, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Loader2 } from 'lucide-react';
import { toast } from '@/shared/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { TabSkeleton } from '../components/shared/TabSkeleton';
import { ReportsFilterBar } from '../components/shared/ReportsFilterBar';
import { FinancialScopeFilters } from '../components/financial/FinancialScopeFilters';
import {
  fetchFinancialMovementsReport,
  financialService,
  filterOptionsService,
} from '../services/reports.service';
import { defaultSituationIds, isSameIdSet } from '../types/reports.types';
import { generateFinancialReportExcel } from '../utils/generateFinancialReportExcel';
import { toastError } from '@/shared/utils/toastError';
import { ReportGuideSheet } from '../components/shared/ReportGuideSheet';
import { financialGuide } from '../guides/reportGuides';

const FinancialDashboard = lazy(() =>
  import('../components/financial/FinancialDashboard').then((m) => ({ default: m.FinancialDashboard })),
);

/** Sin corte: el Excel trae todos los productos, no los 20 de la pantalla. */
const EXPORT_MARGIN_LIMIT = 100000;

export default function MovementsPage() {
  const { filters, draft, applyImmediate } = useReportsFilters();
  const [isExporting, setIsExporting] = useState(false);

  // El catálogo ya está cacheado por el filtro de situación; se lee acá solo
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
      draft.businessAccountId,
      draft.paymentMethodId,
      draft.movementClassId,
    ].filter((v) => v !== null && v !== undefined).length + (situationIsDefault ? 0 : 1);

  function handleClearExtra() {
    applyImmediate({
      ...draft,
      branchId: null,
      businessAccountId: null,
      paymentMethodId: null,
      movementClassId: null,
      situationIds: null,
    });
  }

  // Las dos hojas se piden en paralelo: son independientes y comparten los
  // mismos filtros ya aplicados en la barra.
  async function handleDownload() {
    setIsExporting(true);
    try {
      const [movements, margins] = await Promise.all([
        fetchFinancialMovementsReport(filters),
        financialService.getMarginByProduct(
          filters,
          filters.situationIds ?? defaultSituationIds(situations.data ?? []),
          EXPORT_MARGIN_LIMIT,
        ),
      ]);
      if (movements.length === 0 && margins.length === 0) {
        toast({ title: 'No hay datos para los filtros seleccionados', variant: 'warning' });
        return;
      }
      generateFinancialReportExcel(
        movements,
        margins,
        filters.startDate ?? '',
        filters.endDate ?? '',
      );
      toast({
        title: `${movements.length} movimientos y ${margins.length} productos exportados`,
        variant: 'success',
      });
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
          <h1 className="text-2xl font-bold tracking-tight">Reportes financieros</h1>
          <p className="text-muted-foreground text-sm">Panel de análisis y métricas del negocio</p>
        </div>
        <ReportGuideSheet guide={financialGuide} />
      </div>
      <ReportsFilterBar
        extraFields={<FinancialScopeFilters />}
        extraActiveCount={extraActiveCount}
        onClearExtra={handleClearExtra}
        footNote={
          <>
            Dos fuentes distintas: las tarjetas de arriba, el flujo de caja y los gráficos salen
            de la <strong className="font-medium text-foreground">caja</strong> (ingreso o egreso
            según el signo del movimiento). <strong className="font-medium text-foreground">Ganancia
            Neta, Margen y Costo Total</strong> salen de los{' '}
            <strong className="font-medium text-foreground">pedidos</strong>, valuados al costo
            actual del catálogo; solo cuentan las unidades con costo mayor a cero. Por eso las
            dos partes no suman entre sí. Sede y método de pago afectan a todo; cuenta y motivo
            solo a la caja; estado de pedido solo a la ganancia.
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
        <FinancialDashboard filters={filters} />
      </Suspense>
    </div>
  );
}
