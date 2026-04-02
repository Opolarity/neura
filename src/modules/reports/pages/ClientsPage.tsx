import { Suspense, lazy } from 'react';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { TabSkeleton } from '../components/shared/TabSkeleton';

const CustomersDashboard = lazy(() =>
  import('../components/customers/CustomersDashboard').then((m) => ({ default: m.CustomersDashboard })),
);

export default function ClientsPage() {
  const { filters } = useReportsFilters();
  return (
    <Suspense fallback={<TabSkeleton />}>
      <CustomersDashboard filters={filters} />
    </Suspense>
  );
}
