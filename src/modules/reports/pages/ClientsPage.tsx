import { Suspense, lazy, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Loader2 } from 'lucide-react';
import { toast } from '@/shared/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { fetchCustomersReport, filterOptionsService } from '../services/reports.service';
import { defaultSituationIds, isSameIdSet } from '../types/reports.types';
import { TabSkeleton } from '../components/shared/TabSkeleton';
import { ReportsFilterBar } from '../components/shared/ReportsFilterBar';
import { OrderSituationFilter } from '../components/shared/OrderSituationFilter';
import { OrderScopeFilters } from '../components/shared/OrderScopeFilters';
import { generateCustomersReportExcel } from '../utils/generateCustomersReportExcel';
import { toastError } from '@/shared/utils/toastError';

const CustomersDashboard = lazy(() =>
  import('../components/customers/CustomersDashboard').then((m) => ({ default: m.CustomersDashboard })),
);

export default function ClientsPage() {
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

  // El Excel se genera con los filtros ya aplicados en la barra, sin diálogo,
  // igual que las descargas de Ventas y Productos. Una fila por cliente y sin
  // límite: "Top clientes" corta en el límite elegido, esto trae todos.
  async function handleDownload() {
    if (!filters.startDate || !filters.endDate) {
      toast({ title: 'Elegí un rango de fechas en los filtros antes de exportar', variant: 'warning' });
      return;
    }

    setIsExporting(true);
    try {
      const rows = await fetchCustomersReport(filters);
      if (rows.length === 0) {
        toast({ title: 'No hay clientes para el rango seleccionado', variant: 'warning' });
        return;
      }
      generateCustomersReportExcel(rows, filters.startDate, filters.endDate);
      toast({ title: `Reporte exportado: ${rows.length} clientes`, variant: 'success' });
    } catch (error) {
      toastError(error, 'Error al generar el reporte. Inténtalo de nuevo.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Reportes de clientes</h1>
        <p className="text-muted-foreground text-sm">Panel de análisis y métricas del negocio</p>
      </div>
      <ReportsFilterBar
        // El estado de pedido lleva el default de Ventas (todo menos cancelado y
        // reembolsado); el resto son los mismos campos compartidos que usan
        // Ventas y Productos, todos opcionales.
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
            Un <strong className="font-medium text-foreground">cliente</strong> es cualquiera con
            al menos una compra, con cuenta o sin ella, identificado por su documento. Las ventas
            sin documento, cuenta ni nombre van a un único{' '}
            <strong className="font-medium text-foreground">Sin identificar</strong>: en Top
            clientes es mostrador, no una persona.{' '}
            <strong className="font-medium text-foreground">Lealtad</strong> solo cubre a los
            clientes con cuenta, porque el nivel vive en su ficha.
          </>
        }
      />
      <Suspense fallback={<TabSkeleton />}>
        <CustomersDashboard filters={filters} />
      </Suspense>
    </div>
  );
}
