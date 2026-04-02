import { Suspense, lazy } from 'react';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { TabSkeleton } from '../components/shared/TabSkeleton';

const InventoryDashboard = lazy(() =>
  import('../components/inventory/InventoryDashboard').then((m) => ({ default: m.InventoryDashboard })),
);

export default function StockPage() {
  const { filters } = useReportsFilters();
  return (
    <Suspense fallback={<TabSkeleton />}>
      <InventoryDashboard filters={filters} />
    </Suspense>
  );
}
