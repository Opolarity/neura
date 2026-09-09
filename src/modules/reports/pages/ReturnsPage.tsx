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
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Reportes de cambios/retornos</h1>
        <p className="text-muted-foreground text-sm">Panel de análisis y métricas del negocio</p>
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
            La pestaña cuenta por defecto solo los retornos en situación{' '}
            <strong className="font-medium text-foreground">Aceptado</strong>; los Pendientes y
            Anulados se agregan desde el filtro. Se fechan por el día en que se registró el
            retorno, no por el del pedido.{' '}
            <strong className="font-medium text-foreground">Monto reembolsado</strong> es el neto
            de los movimientos de caja del retorno: los reembolsos suman y las diferencias que
            paga el cliente en un cambio restan; los retornos sin movimiento registrado cuentan en
            la cantidad pero no en el monto, y por eso el promedio se calcula solo sobre los que
            sí lo tienen. No coincide con el{' '}
            <strong className="font-medium text-foreground">Devoluciones</strong> de la pestaña
            Ventas, que atribuye el reembolso a la fecha del pedido y deja fuera los pedidos
            cancelados y reembolsados.{' '}
            <strong className="font-medium text-foreground">Tasa de devolución</strong> compara
            contra los pedidos del período sin los cancelados; los reembolsados sí entran, porque
            esa situación se la pone al pedido la propia devolución. En{' '}
            <strong className="font-medium text-foreground">Productos más devueltos</strong> solo
            entra la mercadería que vuelve: el reemplazo que sale en un cambio no es una
            devolución.
          </>
        }
      />
      <Suspense fallback={<TabSkeleton />}>
        <ReturnsDashboard filters={filters} />
      </Suspense>
    </div>
  );
}
