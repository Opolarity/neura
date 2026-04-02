import { Suspense, lazy } from 'react';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { TabSkeleton } from '../components/shared/TabSkeleton';

const ReturnsDashboard = lazy(() =>
  import('../components/returns/ReturnsDashboard').then((m) => ({ default: m.ReturnsDashboard })),
);

export default function ReturnsPage() {
  const { filters } = useReportsFilters();
  return (
    <Suspense fallback={<TabSkeleton />}>
      <ReturnsDashboard filters={filters} />
    </Suspense>
  );
}
