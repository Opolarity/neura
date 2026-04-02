import { Suspense, lazy } from 'react';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { TabSkeleton } from '../components/shared/TabSkeleton';
import { SalesGeoFilters } from '../components/sales/SalesGeoFilters';

const SalesDashboard = lazy(() =>
  import('../components/sales/SalesDashboard').then((m) => ({ default: m.SalesDashboard })),
);

export default function SalesPage() {
  const { filters, onChange } = useReportsFilters();
  return (
    <div className="space-y-4">
      <SalesGeoFilters filters={filters} onChange={onChange} />
      <Suspense fallback={<TabSkeleton />}>
        <SalesDashboard filters={filters} />
      </Suspense>
    </div>
  );
}
