import { Suspense, lazy } from 'react';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { TabSkeleton } from '../components/shared/TabSkeleton';
import { ReportsFilterBar } from '../components/shared/ReportsFilterBar';

const InventoryDashboard = lazy(() =>
  import('../components/inventory/InventoryDashboard').then((m) => ({ default: m.InventoryDashboard })),
);

export default function StockPage() {
  const { filters } = useReportsFilters();
  return (
    <div className="space-y-4">
      <ReportsFilterBar />
      <Suspense fallback={<TabSkeleton />}>
        <InventoryDashboard filters={filters} />
      </Suspense>
    </div>
  );
}
