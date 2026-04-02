import { Suspense, lazy } from 'react';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { TabSkeleton } from '../components/shared/TabSkeleton';

const SalesDashboard = lazy(() =>
  import('../components/sales/SalesDashboard').then((m) => ({ default: m.SalesDashboard })),
);

export default function SalesPage() {
  const { filters } = useReportsFilters();
  return (
    <Suspense fallback={<TabSkeleton />}>
      <SalesDashboard filters={filters} />
    </Suspense>
  );
}
