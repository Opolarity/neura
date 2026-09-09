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
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Reportes financieros</h1>
        <p className="text-muted-foreground text-sm">Panel de análisis y métricas del negocio</p>
      </div>
      <ReportsFilterBar
        extraFields={<FinancialScopeFilters />}
        extraActiveCount={extraActiveCount}
        onClearExtra={handleClearExtra}
        footNote={
          <>
            Esta pestaña mide{' '}
            <strong className="font-medium text-foreground">dos cosas distintas</strong>. Las
            tarjetas de arriba, el flujo de caja y los dos gráficos salen de los{' '}
            <strong className="font-medium text-foreground">movimientos de caja</strong>: cada
            movimiento entra como ingreso o egreso según el signo de su monto, que es lo que suma
            al saldo de la cuenta.{' '}
            <strong className="font-medium text-foreground">Ganancia Neta</strong>,{' '}
            <strong className="font-medium text-foreground">Margen</strong>,{' '}
            <strong className="font-medium text-foreground">Costo Total</strong> y la tabla de
            productos salen en cambio de los{' '}
            <strong className="font-medium text-foreground">pedidos</strong>, en unidades netas de
            devoluciones confirmadas y valuadas al costo que el producto tiene hoy en el catálogo,
            no al que tenía el día de la venta. Por eso las dos mitades no suman entre sí.
            {' '}La tabla es además solo el{' '}
            <strong className="font-medium text-foreground">Top 20 por margen</strong>, y los
            de mayor margen suelen ser productos de poco volumen: no esperes que sus unidades ni
            su costo sumen a las tarjetas. El Excel sí trae todos los productos del período, sin
            ese corte, y ahí las dos cifras cuadran.
            {' '}Sede y método de pago acotan las dos mitades; cuenta y motivo, solo la caja;
            estado de pedido, solo la mitad de ganancia y margen.
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
