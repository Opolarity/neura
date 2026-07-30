import { Suspense, lazy } from 'react';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { TabSkeleton } from '../components/shared/TabSkeleton';
import { ReportsFilterBar } from '../components/shared/ReportsFilterBar';

const FinancialDashboard = lazy(() =>
  import('../components/financial/FinancialDashboard').then((m) => ({ default: m.FinancialDashboard })),
);

export default function MovementsPage() {
  const { filters } = useReportsFilters();
  return (
    <div className="space-y-4">
      <ReportsFilterBar />
      <Suspense fallback={<TabSkeleton />}>
        <FinancialDashboard filters={filters} />
      </Suspense>
    </div>
  );
}
