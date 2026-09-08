import { Suspense, lazy } from 'react';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { TabSkeleton } from '../components/shared/TabSkeleton';
import { ReportsFilterBar } from '../components/shared/ReportsFilterBar';
import { InventoryOptionsPanel } from '../components/inventory/InventoryOptionsPanel';
import { useInventoryDashboard } from '../hooks/useInventoryDashboard';

const InventoryDashboard = lazy(() =>
  import('../components/inventory/InventoryDashboard').then((m) => ({ default: m.InventoryDashboard })),
);

export default function StockPage() {
  const { filters } = useReportsFilters();
  const dash = useInventoryDashboard(filters);

  const extraActiveCount = [
    dash.warehouseId,
    dash.thresholdOverride,
    dash.valuationPriceListId,
  ].filter((v) => v !== null && v !== undefined).length;

  function handleClearExtra() {
    dash.setWarehouseId(undefined);
    dash.setThresholdOverride(undefined);
    dash.setValuationPriceListId(undefined);
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Reportes de inventario</h1>
        <p className="text-muted-foreground text-sm">Panel de análisis y métricas del negocio</p>
      </div>
      <ReportsFilterBar
        extraFields={<InventoryOptionsPanel dash={dash} />}
        extraActiveCount={extraActiveCount}
        onClearExtra={handleClearExtra}
        footNote={
          <>
            Casi todo Inventario es una{' '}
            <strong className="font-medium text-foreground">foto del stock de hoy</strong> y no
            depende del rango de fechas: las tarjetas, la valorización, el stock por categoría y
            por talla, la bandeja de reposición y el stock muerto. El rango solo afecta a{' '}
            <strong className="font-medium text-foreground">Flujo de inventario</strong>,{' '}
            <strong className="font-medium text-foreground">Tipos de movimiento</strong> y{' '}
            <strong className="font-medium text-foreground">Rotación</strong>, que miden
            movimientos del período. Los filtros de canal, método de pago y geografía no existen
            acá porque el stock no sale de un pedido; el equivalente de sede es el almacén.
          </>
        }
      />
      <Suspense fallback={<TabSkeleton />}>
        <InventoryDashboard dash={dash} />
      </Suspense>
    </div>
  );
}
