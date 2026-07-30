import { Suspense, lazy } from 'react';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { TabSkeleton } from '../components/shared/TabSkeleton';
import { ReportsFilterBar } from '../components/shared/ReportsFilterBar';

const ReturnsDashboard = lazy(() =>
  import('../components/returns/ReturnsDashboard').then((m) => ({ default: m.ReturnsDashboard })),
);

export default function ReturnsPage() {
  const { filters } = useReportsFilters();
  return (
    <div className="space-y-4">
      <ReportsFilterBar />
      <Suspense fallback={<TabSkeleton />}>
        <ReturnsDashboard filters={filters} />
      </Suspense>
    </div>
  );
}
