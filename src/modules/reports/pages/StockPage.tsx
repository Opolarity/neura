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
    dash.threshold !== 10 ? dash.threshold : undefined,
  ].filter((v) => v !== null && v !== undefined).length;

  function handleClearExtra() {
    dash.setWarehouseId(undefined);
    dash.setThreshold(10);
  }

  return (
    <div className="space-y-4">
      <ReportsFilterBar
        extraFields={<InventoryOptionsPanel dash={dash} />}
        extraActiveCount={extraActiveCount}
        onClearExtra={handleClearExtra}
      />
      <Suspense fallback={<TabSkeleton />}>
        <InventoryDashboard dash={dash} />
      </Suspense>
    </div>
  );
}
